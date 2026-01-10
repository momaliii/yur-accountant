import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Session from '../models/Session.js';
import twoFAService from '../services/2fa.js';
import encryptionService from '../services/encryption.js';
import { getClientIp, getUserAgent } from '../utils/activityLogger.js';
import { getUserId } from '../middleware/auth.js';
import bcrypt from 'bcrypt';

// Helper to log security events
async function logSecurityEvent(userId, action, resourceType, resourceId, severity = 'medium', metadata = {}) {
  try {
    const auditLog = new AuditLog({
      userId,
      action,
      resourceType,
      resourceId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      severity,
      metadata,
    });
    await auditLog.save();
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

export default async function securityRoutes(fastify) {
  // Test endpoint to verify authentication
  fastify.get('/api/security/test', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userId = getUserId(request);
    return { 
      success: true, 
      userId,
      user: request.user,
      message: 'Authentication working correctly' 
    };
  });

  // 2FA routes have been moved to security2fa.js for a simpler implementation
  // The following 2FA routes are disabled - use security2FARoutes instead
  
  // OLD 2FA ENABLE ROUTE - DISABLED (moved to security2fa.js)
  /*
  fastify.post('/api/security/2fa/enable', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      // Debug logging
      fastify.log.info('2FA enable request received', { 
        user: request.user,
        hasUser: !!request.user,
        headers: {
          authorization: request.headers.authorization ? 'present' : 'missing'
        }
      });
      
      const userId = getUserId(request);
      
      fastify.log.info('Extracted userId', { userId });
      
      if (!userId) {
        fastify.log.warn('No userId found in request', { user: request.user });
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        fastify.log.warn('User not found', { userId });
        return reply.status(404).send({ error: 'User not found' });
      }
      
      if (user.twoFactorEnabled) {
        fastify.log.info('2FA already enabled for user', { userId });
        return reply.status(400).send({ error: '2FA is already enabled for this account' });
      }
      
      if (!user.email) {
        fastify.log.warn('User email missing', { userId });
        return reply.status(400).send({ error: 'User email is required to enable 2FA' });
      }
      
      fastify.log.info('Starting 2FA setup for user', { userId, email: user.email });
      
      // Generate secret
      fastify.log.info('Generating 2FA secret...');
      const { secret, encryptedSecret, otpauthUrl } = await twoFAService.generateSecret(user.email);
      fastify.log.info('2FA secret generated successfully');
      
      // Generate QR code
      fastify.log.info('Generating QR code...');
      const qrCode = await twoFAService.generateQRCode(otpauthUrl);
      fastify.log.info('QR code generated successfully');
      
      // Generate backup codes
      fastify.log.info('Generating backup codes...');
      const { codes, encryptedCodes } = twoFAService.generateBackupCodes();
      fastify.log.info('Backup codes generated', { count: codes.length });
      
      // Store encrypted secret and backup codes (temporarily, until verified)
      // Stringify the encrypted secret object for storage
      user.twoFactorSecret = JSON.stringify(encryptedSecret);
      // Stringify each encrypted backup code for storage
      user.twoFactorBackupCodes = encryptedCodes.map(code => JSON.stringify(code));
      await user.save();
      fastify.log.info('User 2FA data saved');
      
      await logSecurityEvent(userId, '2fa_enable_initiated', 'user', userId.toString(), 'medium', {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      fastify.log.info('2FA enable completed successfully', { userId });
      
      return reply.send({
        secret,
        qrCode,
        backupCodes: codes, // Show once only
        message: 'Scan the QR code with your authenticator app and verify with a code',
      });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      fastify.log.error('2FA enable error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        user: request.user,
      });
      
      // Check for specific error types
      if (error.message && error.message.includes('not installed')) {
        return reply.status(500).send({ 
          error: '2FA service is not properly configured. Please contact support.' 
        });
      }
      
      // If it's a validation error or bad request, return 400
      if (error.statusCode === 400 || error.name === 'ValidationError') {
        return reply.status(400).send({ 
          error: error.message || 'Invalid request. Please check your input.' 
        });
      }
      
      return reply.status(500).send({ 
        error: error.message || 'Failed to enable 2FA. Please try again later.' 
      });
    }
  });
  */

  // OLD 2FA VERIFY ROUTE - DISABLED (moved to security2fa.js)
  /*
  fastify.post('/api/security/2fa/verify', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      
      const { code, backupCode } = request.body;
      
      if (!code && !backupCode) {
        return reply.status(400).send({ error: 'Either a verification code or backup code is required' });
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      if (!user.twoFactorSecret) {
        return reply.status(400).send({ error: '2FA setup not initiated. Please enable 2FA first.' });
      }
      
      let verified = false;
      
      // Try TOTP code first
      if (code) {
        if (typeof code !== 'string' || code.length !== 6 || !/^\d+$/.test(code)) {
          return reply.status(400).send({ error: 'Invalid verification code. Must be a 6-digit number.' });
        }
        const encryptedSecret = JSON.parse(user.twoFactorSecret);
        const decryptedSecret = encryptionService.decrypt(encryptedSecret);
        verified = await twoFAService.verifyToken(decryptedSecret, code);
      }
      
      // Try backup code if TOTP failed
      if (!verified && backupCode && user.twoFactorBackupCodes?.length > 0) {
        // Parse stringified backup codes back to objects
        const parsedBackupCodes = user.twoFactorBackupCodes.map(code => {
          try {
            return typeof code === 'string' ? JSON.parse(code) : code;
          } catch {
            return code;
          }
        });
        verified = twoFAService.verifyBackupCode(parsedBackupCodes, backupCode);
        if (verified) {
          // Remove used backup code
          user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter((encryptedStr) => {
            try {
              const encrypted = typeof encryptedStr === 'string' ? JSON.parse(encryptedStr) : encryptedStr;
              const decrypted = encryptionService.decrypt(encrypted);
              return decrypted !== backupCode.toUpperCase();
            } catch {
              return true; // Keep if can't parse/decrypt
            }
          });
        }
      }
      
      if (!verified) {
        await logSecurityEvent(userId, '2fa_verification_failed', 'user', userId.toString(), 'high', {
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
        });
        return reply.status(400).send({ error: 'Invalid code. Please try again.' });
      }
      
      // Enable 2FA
      user.twoFactorEnabled = true;
      await user.save();
      
      await logSecurityEvent(userId, '2fa_enabled', 'user', userId.toString(), 'high', {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return reply.send({ success: true, message: '2FA enabled successfully' });
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      fastify.log.error('2FA verify error:', error);
      return reply.status(500).send({ 
        error: error.message || 'Failed to verify 2FA. Please try again.' 
      });
    }
  });
  */

  // OLD 2FA DISABLE ROUTE - DISABLED (moved to security2fa.js)
  /*
  // Disable 2FA
  fastify.post('/api/security/2fa/disable', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      const { password } = request.body;
      const user = await User.findById(userId);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      // Verify password
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return reply.status(400).send({ error: 'Invalid password' });
      }
      
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      user.twoFactorBackupCodes = [];
      await user.save();
      
      await logSecurityEvent(userId, '2fa_disabled', 'user', userId.toString(), 'high', {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return reply.send({ success: true, message: '2FA disabled successfully' });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return reply.status(500).send({ error: 'Failed to disable 2FA' });
    }
  });
  */

  // OLD 2FA BACKUP CODES ROUTE - DISABLED (moved to security2fa.js)
  /*
  // Generate new backup codes
  fastify.get('/api/security/2fa/backup-codes', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      const user = await User.findById(userId);
      
      if (!user || !user.twoFactorEnabled) {
        return reply.status(400).send({ error: '2FA is not enabled' });
      }
      
      const { codes, encryptedCodes } = twoFAService.generateBackupCodes();
      user.twoFactorBackupCodes = encryptedCodes;
      await user.save();
      
      await logSecurityEvent(userId, '2fa_backup_codes_regenerated', 'user', userId.toString(), 'medium', {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return reply.send({ backupCodes: codes });
    } catch (error) {
      console.error('Error generating backup codes:', error);
      return reply.status(500).send({ error: 'Failed to generate backup codes' });
    }
  });
  */

  // Get audit logs
  fastify.get('/api/security/audit-logs', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      const user = await User.findById(userId);
      const { page = 1, limit = 50, action, severity } = request.query;
      
      // Only admins can see all logs, users see only their own
      const query = user.role === 'admin' ? {} : { userId };
      
      if (action) query.action = action;
      if (severity) query.severity = severity;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('userId', 'email profile.name'),
        AuditLog.countDocuments(query),
      ]);
      
      return reply.send({ logs, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return reply.status(500).send({ error: 'Failed to fetch audit logs' });
    }
  });

  // Get active sessions
  fastify.get('/api/security/sessions', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      const currentToken = request.headers.authorization?.replace('Bearer ', '');
      
      const sessions = await Session.find({
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).sort({ lastActivity: -1 });
      
      return reply.send({
        sessions: sessions.map((s) => ({
          id: s._id,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          deviceInfo: s.deviceInfo,
          lastActivity: s.lastActivity,
          expiresAt: s.expiresAt,
          isCurrent: s.token === currentToken,
        })),
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return reply.status(500).send({ error: 'Failed to fetch sessions' });
    }
  });

  // Revoke session
  fastify.delete('/api/security/sessions/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      const sessionId = request.params.id;
      
      const session = await Session.findOne({ _id: sessionId, userId });
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }
      
      session.isActive = false;
      await session.save();
      
      await logSecurityEvent(userId, 'session_revoked', 'session', sessionId, 'medium', {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return reply.send({ success: true, message: 'Session revoked' });
    } catch (error) {
      console.error('Error revoking session:', error);
      return reply.status(500).send({ error: 'Failed to revoke session' });
    }
  });

  // Record GDPR consent
  fastify.post('/api/security/consent', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      const { consentGiven } = request.body;
      const user = await User.findById(userId);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      user.consentGiven = consentGiven;
      user.consentDate = new Date();
      await user.save();
      
      await logSecurityEvent(userId, 'consent_updated', 'user', userId.toString(), 'low', {
        consentGiven,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return reply.send({ success: true, message: 'Consent recorded' });
    } catch (error) {
      console.error('Error recording consent:', error);
      return reply.status(500).send({ error: 'Failed to record consent' });
    }
  });

  // Export user data (GDPR)
  fastify.get('/api/security/export-data', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      
      // Import all models
      const Client = (await import('../models/Client.js')).default;
      const Income = (await import('../models/Income.js')).default;
      const Expense = (await import('../models/Expense.js')).default;
      const Debt = (await import('../models/Debt.js')).default;
      const Goal = (await import('../models/Goal.js')).default;
      const Invoice = (await import('../models/Invoice.js')).default;
      const Todo = (await import('../models/Todo.js')).default;
      const Saving = (await import('../models/Saving.js')).default;
      
      // Fetch all user data
      const [user, clients, income, expenses, debts, goals, invoices, todos, savings] = await Promise.all([
        User.findById(userId).select('-password -twoFactorSecret -twoFactorBackupCodes'),
        Client.find({ userId }),
        Income.find({ userId }),
        Expense.find({ userId }),
        Debt.find({ userId }),
        Goal.find({ userId }),
        Invoice.find({ userId }),
        Todo.find({ userId }),
        Saving.find({ userId }),
      ]);
      
      const exportData = {
        user: {
          email: user.email,
          profile: user.profile,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
        data: {
          clients,
          income,
          expenses,
          debts,
          goals,
          invoices,
          todos,
          savings,
        },
        exportedAt: new Date().toISOString(),
      };
      
      await logSecurityEvent(userId, 'data_exported', 'user', userId.toString(), 'low', {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return reply.send(exportData);
    } catch (error) {
      console.error('Error exporting data:', error);
      return reply.status(500).send({ error: 'Failed to export data' });
    }
  });

  // Delete account and all data (GDPR)
  fastify.delete('/api/security/delete-account', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      
      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }
      const { password, confirm } = request.body;
      
      if (confirm !== 'DELETE') {
        return reply.status(400).send({ error: 'Confirmation required. Type DELETE to confirm.' });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      // Verify password
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return reply.status(400).send({ error: 'Invalid password' });
      }
      
      // Import all models
      const Client = (await import('../models/Client.js')).default;
      const Income = (await import('../models/Income.js')).default;
      const Expense = (await import('../models/Expense.js')).default;
      const Debt = (await import('../models/Debt.js')).default;
      const Goal = (await import('../models/Goal.js')).default;
      const Invoice = (await import('../models/Invoice.js')).default;
      const Todo = (await import('../models/Todo.js')).default;
      const Saving = (await import('../models/Saving.js')).default;
      const Subscription = (await import('../models/Subscription.js')).default;
      const Session = (await import('../models/Session.js')).default;
      
      // Delete all user data
      await Promise.all([
        Client.deleteMany({ userId }),
        Income.deleteMany({ userId }),
        Expense.deleteMany({ userId }),
        Debt.deleteMany({ userId }),
        Goal.deleteMany({ userId }),
        Invoice.deleteMany({ userId }),
        Todo.deleteMany({ userId }),
        Saving.deleteMany({ userId }),
        Subscription.deleteMany({ userId }),
        Session.deleteMany({ userId }),
        User.deleteOne({ _id: userId }),
      ]);
      
      await logSecurityEvent(userId, 'account_deleted', 'user', userId.toString(), 'critical', {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return reply.send({ success: true, message: 'Account and all data deleted' });
    } catch (error) {
      console.error('Error deleting account:', error);
      return reply.status(500).send({ error: 'Failed to delete account' });
    }
  });
}
