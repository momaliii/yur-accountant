import { useState, useEffect } from 'react';
import { Trash2, Monitor, Smartphone, Tablet, Globe } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import securityService from '../../services/api/security';

const getDeviceIcon = (userAgent) => {
  if (!userAgent) return Globe;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return Smartphone;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return Tablet;
  }
  return Monitor;
};

const formatUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  
  // Extract browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  // Extract OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  return `${browser} on ${os}`;
};

export default function SessionsList() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await securityService.getSessions();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    
    try {
      await securityService.revokeSession(sessionId);
      await loadSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      alert('Failed to revoke session');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-400">Loading sessions...</div>;
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
      {sessions.length === 0 ? (
        <p className="text-slate-400 text-sm">No active sessions</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.userAgent);
            return (
              <div
                key={session.id}
                className={`p-4 rounded-lg border ${
                  session.isCurrent
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <DeviceIcon className="w-5 h-5 text-slate-400 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {formatUserAgent(session.userAgent)}
                        </span>
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 space-y-1">
                        <div>IP: {session.ipAddress || 'Unknown'}</div>
                        <div>Last activity: {formatDate(session.lastActivity)}</div>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleRevoke(session.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
