import AppVersion from '../models/AppVersion.js';

// Simple semver comparison
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

export default async function appUpdatesRoutes(fastify) {
  // Get current app version info
  fastify.get('/api/app/version', async (request, reply) => {
    try {
      const { platform, version } = request.query;
      
      if (!platform || !version) {
        return reply.status(400).send({ error: 'Platform and version are required' });
      }
      
      const currentVersion = await AppVersion.findOne({
        platform,
        version,
        isActive: true,
      });
      
      return reply.send({ version: currentVersion });
    } catch (error) {
      console.error('Error fetching app version:', error);
      return reply.status(500).send({ error: 'Failed to fetch app version' });
    }
  });

  // Check for updates
  fastify.get('/api/app/updates/check', async (request, reply) => {
    try {
      const { platform, version } = request.query;
      
      if (!platform || !version) {
        return reply.status(400).send({ error: 'Platform and version are required' });
      }
      
      // Get latest version for platform
      const latestVersion = await AppVersion.findOne({
        platform,
        isActive: true,
      }).sort({ releaseDate: -1 });
      
      if (!latestVersion) {
        return reply.send({ updateAvailable: false });
      }
      
      // Compare versions
      const hasUpdate = compareVersions(latestVersion.version, version) > 0;
      
      if (!hasUpdate) {
        return reply.send({ updateAvailable: false });
      }
      
      // Check if update is required
      const isRequired = latestVersion.isRequired || false;
      
      // Check minimum supported version
      let mustUpdate = false;
      if (latestVersion.minSupportedVersion) {
        mustUpdate = compareVersions(version, latestVersion.minSupportedVersion) < 0;
      }
      
      return reply.send({
        updateAvailable: true,
        latestVersion: {
          version: latestVersion.version,
          buildNumber: latestVersion.buildNumber,
          releaseNotes: latestVersion.releaseNotes,
          downloadUrl: latestVersion.downloadUrl,
          manifestUrl: latestVersion.manifestUrl,
          isRequired: isRequired || mustUpdate,
          releaseDate: latestVersion.releaseDate,
          updateSize: latestVersion.updateSize,
        },
      });
    } catch (error) {
      console.error('Error checking for updates:', error);
      return reply.status(500).send({ error: 'Failed to check for updates' });
    }
  });

  // Get update manifest for specific platform (admin only)
  fastify.get('/api/app/updates/:platform', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { platform } = request.params;
      const user = request.user;
      
      // Only admins can access this
      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }
      
      const versions = await AppVersion.find({
        platform,
      }).sort({ releaseDate: -1 });
      
      return reply.send({ versions });
    } catch (error) {
      console.error('Error fetching update manifest:', error);
      return reply.status(500).send({ error: 'Failed to fetch update manifest' });
    }
  });

  // Register device for update notifications (optional)
  fastify.post('/api/app/updates/register', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { deviceId, platform, version, pushToken } = request.body;
      const userId = request.user.id;
      
      // In a real implementation, you would store this in a Device model
      // For now, just acknowledge the registration
      
      return reply.send({ 
        registered: true,
        message: 'Device registered for update notifications',
      });
    } catch (error) {
      console.error('Error registering device:', error);
      return reply.status(500).send({ error: 'Failed to register device' });
    }
  });

  // Admin routes for managing app versions
  // Create app version
  fastify.post('/api/admin/app-versions', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user;
      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const versionData = request.body;
      const version = new AppVersion(versionData);
      await version.save();

      return reply.send({ version, message: 'App version created successfully' });
    } catch (error) {
      console.error('Error creating app version:', error);
      return reply.status(500).send({ error: 'Failed to create app version' });
    }
  });

  // Update app version
  fastify.put('/api/admin/app-versions/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user;
      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { id } = request.params;
      const versionData = request.body;

      const version = await AppVersion.findByIdAndUpdate(id, versionData, { new: true });
      if (!version) {
        return reply.status(404).send({ error: 'App version not found' });
      }

      return reply.send({ version, message: 'App version updated successfully' });
    } catch (error) {
      console.error('Error updating app version:', error);
      return reply.status(500).send({ error: 'Failed to update app version' });
    }
  });

  // Delete app version
  fastify.delete('/api/admin/app-versions/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user;
      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { id } = request.params;
      const version = await AppVersion.findByIdAndDelete(id);
      if (!version) {
        return reply.status(404).send({ error: 'App version not found' });
      }

      return reply.send({ message: 'App version deleted successfully' });
    } catch (error) {
      console.error('Error deleting app version:', error);
      return reply.status(500).send({ error: 'Failed to delete app version' });
    }
  });

  // Get all app versions (admin only, for all platforms)
  fastify.get('/api/app/updates', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user;
      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { platform } = request.query;
      const query = platform && platform !== 'all' ? { platform } : {};
      const versions = await AppVersion.find(query).sort({ releaseDate: -1 });

      return reply.send({ versions });
    } catch (error) {
      console.error('Error fetching app versions:', error);
      return reply.status(500).send({ error: 'Failed to fetch app versions' });
    }
  });
}
