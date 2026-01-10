import { useEffect, useState } from 'react';
import { Download, X, RefreshCw, AlertCircle } from 'lucide-react';
import { checkForUpdates, getCurrentVersion } from '../services/appUpdate';
import Button from './ui/Button';
import Card from './ui/Card';

export default function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true); // Auto-update enabled by default

  useEffect(() => {
    // Check for updates on mount
    handleCheckForUpdates();

    // Check periodically (every 15 minutes for mobile, 30 minutes for web)
    const checkInterval = window.Capacitor ? 15 * 60 * 1000 : 30 * 60 * 1000;
    const interval = setInterval(handleCheckForUpdates, checkInterval);

    // Check when app comes into focus (for mobile)
    const handleFocus = () => {
      handleCheckForUpdates();
    };
    window.addEventListener('focus', handleFocus);

    // Check when app becomes visible (for mobile background/foreground)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleCheckForUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleCheckForUpdates = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await checkForUpdates();
      if (result.updateAvailable) {
        setUpdateInfo(result.latestVersion);
        setIsDismissed(false);
        
        // Auto-update if enabled and update is required
        if (autoUpdateEnabled && result.latestVersion.isRequired) {
          // Automatically apply required updates
          setTimeout(() => {
            handleAutoUpdate(result.latestVersion);
          }, 2000); // Wait 2 seconds to show notification
        } else if (autoUpdateEnabled && window.Capacitor) {
          // For mobile apps, auto-update optional updates in background
          handleAutoUpdate(result.latestVersion, true);
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAutoUpdate = async (update, silent = false) => {
    if (isDownloading) return;
    
    if (!silent) {
      setIsDownloading(true);
    }
    
    try {
      // For Capacitor Live Updates
      if (window.Capacitor?.Plugins?.LiveUpdates) {
        await window.Capacitor.Plugins.LiveUpdates.sync({
          appId: 'com.mdz.yuraccountant',
          channel: 'production',
        });
        
        // Reload app after update
        if (!silent) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // Silent update - reload in background
          window.location.reload();
        }
      } else if (update.downloadUrl) {
        // For native app updates, redirect to download
        if (update.isRequired) {
          window.location.href = update.downloadUrl;
        }
      } else {
        // For web apps, reload to get latest version
        if (!silent) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error applying auto-update:', error);
      if (!silent) {
        setIsDownloading(false);
      }
    }
  };

  const handleDownload = async () => {
    if (!updateInfo || isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      // For Capacitor Live Updates
      if (window.Capacitor?.Plugins?.LiveUpdates) {
        await window.Capacitor.Plugins.LiveUpdates.sync({
          appId: 'com.mdz.yuraccountant',
          channel: 'production',
        });
        // Reload app after update
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else if (updateInfo.downloadUrl) {
        // For native app updates, redirect to download
        window.location.href = updateInfo.downloadUrl;
      } else {
        // For web apps, reload to get latest version
        window.location.reload();
      }
    } catch (error) {
      console.error('Error applying update:', error);
      setIsDownloading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't show if dismissed or no update available
  // Always show required updates, even if dismissed
  if ((isDismissed && !updateInfo?.isRequired) || !updateInfo) {
    return null;
  }

  const isRequired = updateInfo.isRequired;
  
  // Check if running on mobile
  const isMobile = window.Capacitor && (window.Capacitor.getPlatform() === 'ios' || window.Capacitor.getPlatform() === 'android');

  return (
    <Card className={`mb-4 ${isRequired ? 'border-red-500/50 bg-red-500/10 animate-pulse' : 'border-indigo-500/50 bg-indigo-500/10'}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${isRequired ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}>
          {isRequired ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <Download className="w-5 h-5 text-indigo-400" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">
            {isRequired ? 'Update Required' : isMobile ? 'Update Available' : 'Update Available'}
            {isMobile && autoUpdateEnabled && !isRequired && (
              <span className="ml-2 text-xs text-green-400">(Auto-updating...)</span>
            )}
          </h3>
          <p className="text-sm text-slate-400 mb-2">
            Version {updateInfo.version} is now available.
            {updateInfo.releaseNotes && (
              <span className="block mt-1">{updateInfo.releaseNotes}</span>
            )}
          </p>
          {updateInfo.updateSize > 0 && (
            <p className="text-xs text-slate-500 mb-2">
              Size: {(updateInfo.updateSize / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          {isRequired && isMobile && (
            <p className="text-xs text-amber-400 mb-2">
              This update will be applied automatically in a few seconds...
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <Button
              variant={isRequired ? 'danger' : 'primary'}
              size="sm"
              icon={isDownloading ? RefreshCw : Download}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? 'Updating...' : isRequired ? 'Update Now' : 'Update Now'}
            </Button>
            {!isRequired && (
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                onClick={handleDismiss}
              >
                Later
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
