import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Download, Trash2, CheckCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';
import securityService from '../services/api/security';
import SessionsList from '../components/security/SessionsList';
import AuditLogViewer from '../components/security/AuditLogViewer';

export default function Security() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('sessions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // GDPR
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [consentGiven, setConsentGiven] = useState(user?.consentGiven || false);

  useEffect(() => {
    // Refresh user data
    if (user) {
      setConsentGiven(user.consentGiven || false);
    }
  }, [user]);

  const handleExportData = async () => {
    setLoading(true);
    try {
      const data = await securityService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yur-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Data exported successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    if (!deletePassword) {
      setError('Password is required');
      return;
    }

    if (!confirm('Are you absolutely sure? This will permanently delete your account and all data. This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await securityService.deleteAccount(deletePassword, deleteConfirm);
      alert('Your account has been deleted. You will be logged out.');
      logout();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (value) => {
    try {
      await securityService.recordConsent(value);
      setConsentGiven(value);
      setSuccess('Consent preference saved');
    } catch (error) {
      setError('Failed to update consent');
    }
  };

  const tabs = [
    { id: 'sessions', label: 'Sessions', icon: Lock },
    { id: 'audit', label: 'Audit Logs', icon: Eye },
    { id: 'gdpr', label: 'Privacy & Data', icon: Download },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Security Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account security and privacy settings</p>
      </div>

      {/* Messages */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </Card>
      )}
      {success && (
        <Card className="border-green-500/30 bg-green-500/10">
          <p className="text-green-400">{success}</p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'sessions' && <SessionsList />}

        {activeTab === 'audit' && <AuditLogViewer />}

        {activeTab === 'gdpr' && (
          <div className="space-y-6">
            {/* Consent */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Data Consent</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white mb-1">I consent to data processing</p>
                  <p className="text-sm text-slate-400">
                    By enabling this, you agree to our data processing practices
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => handleConsentChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </Card>

            {/* Export Data */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Export Your Data</h3>
              <p className="text-sm text-slate-400 mb-4">
                Download a copy of all your data in JSON format
              </p>
              <Button variant="outline" icon={Download} onClick={handleExportData} disabled={loading}>
                {loading ? 'Exporting...' : 'Export Data'}
              </Button>
            </Card>

            {/* Delete Account */}
            <Card className="border-red-500/30 bg-red-500/10">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Delete Account</h3>
              <p className="text-sm text-slate-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="space-y-4">
                <Input
                  type="password"
                  label="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
                <Input
                  type="text"
                  label="Type DELETE to confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                />
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirm !== 'DELETE'}
                >
                  {loading ? 'Deleting...' : 'Delete Account Permanently'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
