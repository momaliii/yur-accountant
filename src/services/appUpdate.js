import apiClient from './api/client';

// Get current app version from package.json or environment
export const getCurrentVersion = () => {
  // In a real app, this would come from package.json or build manifest
  // For now, using a placeholder that can be set via environment variable
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
};

// Get current platform
const getCurrentPlatform = () => {
  if (typeof window === 'undefined') return 'web';
  
  // Check if running in Capacitor
  if (window.Capacitor) {
    const platform = window.Capacitor.getPlatform();
    return platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web';
  }
  
  // Check if running in Electron
  if (window.electron || (window.process && window.process.type === 'renderer')) {
    return 'web'; // Electron apps are treated as web
  }
  
  return 'web';
};

// Check for updates
export const checkForUpdates = async () => {
  try {
    const platform = getCurrentPlatform();
    const version = getCurrentVersion();
    
    const response = await apiClient.get('/api/app/updates/check', {
      params: { platform, version },
    });
    
    return response;
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { updateAvailable: false, error: error.message };
  }
};

// Get current version info
export const getCurrentVersionInfo = async () => {
  try {
    const platform = getCurrentPlatform();
    const version = getCurrentVersion();
    
    const response = await apiClient.get('/api/app/version', {
      params: { platform, version },
    });
    
    return response.version;
  } catch (error) {
    console.error('Error fetching version info:', error);
    return null;
  }
};

// Register device for push notifications (optional)
export const registerDevice = async (deviceId, pushToken) => {
  try {
    const platform = getCurrentPlatform();
    const version = getCurrentVersion();
    
    const response = await apiClient.post('/api/app/updates/register', {
      deviceId,
      platform,
      version,
      pushToken,
    });
    
    return response;
  } catch (error) {
    console.error('Error registering device:', error);
    return null;
  }
};

// Compare versions (semver)
export const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
};

export default {
  checkForUpdates,
  getCurrentVersionInfo,
  registerDevice,
  compareVersions,
  getCurrentVersion,
  getCurrentPlatform,
};
