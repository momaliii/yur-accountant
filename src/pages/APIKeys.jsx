import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import apiClient from '../services/api/client';

export default function APIKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', permissions: [] });
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get('/api/api-keys');
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      setApiKeys([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const createAPIKey = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/api/api-keys', newKey);
      setShowCreateModal(false);
      setNewKey({ name: '', permissions: [] });
      loadAPIKeys();
      // Show the key once (it won't be shown again)
      if (response.key) {
        setVisibleKeys(new Set([response._id]));
        setCopiedKey(response._id);
        setTimeout(() => setCopiedKey(null), 3000);
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const deleteAPIKey = async (id) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/api/api-keys/${id}`);
      loadAPIKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const toggleKeyVisibility = (id) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const availablePermissions = [
    'read:clients',
    'write:clients',
    'read:income',
    'write:income',
    'read:expenses',
    'write:expenses',
    'read:all',
    'write:all',
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">API Keys</h1>
          <p className="text-slate-400 mt-1">Manage API keys for programmatic access</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" icon={Plus}>
          Create API Key
        </Button>
      </div>

      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Key size={48} className="mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No API keys configured</p>
            </div>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey._id}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{apiKey.name}</h3>
                      {apiKey.isActive ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                          <CheckCircle size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-slate-400 mb-1">Key:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-sm text-slate-300 font-mono">
                          {visibleKeys.has(apiKey._id) ? apiKey.key : '•'.repeat(40)}
                        </code>
                        <Button
                          onClick={() => toggleKeyVisibility(apiKey._id)}
                          variant="secondary"
                          size="sm"
                          icon={visibleKeys.has(apiKey._id) ? EyeOff : Eye}
                        />
                        <Button
                          onClick={() => copyToClipboard(apiKey.key, apiKey._id)}
                          variant="secondary"
                          size="sm"
                          icon={copiedKey === apiKey._id ? CheckCircle : Copy}
                        >
                          {copiedKey === apiKey._id ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-slate-400 mb-1">Permissions:</p>
                      <div className="flex flex-wrap gap-2">
                        {apiKey.permissions.map((perm, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>Usage: {apiKey.usageCount || 0}</span>
                      {apiKey.lastUsed && (
                        <span>Last used: {new Date(apiKey.lastUsed).toLocaleString()}</span>
                      )}
                      {apiKey.expiresAt && (
                        <span>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteAPIKey(apiKey._id)}
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Create API Key</h2>
            <form onSubmit={createAPIKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  placeholder="My API Key"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-slate-800 p-4 rounded-lg">
                  {availablePermissions.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newKey.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKey({ ...newKey, permissions: [...newKey.permissions, perm] });
                          } else {
                            setNewKey({ ...newKey, permissions: newKey.permissions.filter(p => p !== perm) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-300">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  Create API Key
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
