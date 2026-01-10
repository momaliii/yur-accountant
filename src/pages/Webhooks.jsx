import { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import apiClient from '../services/api/client';

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: '', events: [] });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get('/api/webhooks');
      setWebhooks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      setWebhooks([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const createWebhook = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/webhooks', newWebhook);
      setShowCreateModal(false);
      setNewWebhook({ url: '', events: [] });
      loadWebhooks();
    } catch (error) {
      console.error('Error creating webhook:', error);
    }
  };

  const deleteWebhook = async (id) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await apiClient.delete(`/api/webhooks/${id}`);
      loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const toggleWebhook = async (id, isActive) => {
    try {
      await apiClient.put(`/api/webhooks/${id}`, { isActive: !isActive });
      loadWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const availableEvents = [
    'user.created',
    'user.updated',
    'client.created',
    'client.updated',
    'client.deleted',
    'income.created',
    'income.updated',
    'expense.created',
    'expense.updated',
    'payment.completed',
    'payment.failed',
    'subscription.created',
    'subscription.updated',
    'subscription.cancelled',
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
          <h1 className="text-3xl font-bold gradient-text">Webhooks</h1>
          <p className="text-slate-400 mt-1">Manage webhook endpoints for real-time event notifications</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" icon={Plus}>
          Create Webhook
        </Button>
      </div>

      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Webhook size={48} className="mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No webhooks configured</p>
            </div>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{webhook.url}</h3>
                    {webhook.isActive ? (
                      <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                        <CheckCircle size={12} />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        <XCircle size={12} />
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mb-2">
                    <p className="text-sm text-slate-400 mb-1">Events:</p>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>Success: {webhook.successCount || 0}</span>
                    <span>Failures: {webhook.failureCount || 0}</span>
                    {webhook.lastTriggered && (
                      <span>Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleWebhook(webhook._id, webhook.isActive)}
                    variant="secondary"
                    size="sm"
                  >
                    {webhook.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    onClick={() => deleteWebhook(webhook._id)}
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

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Create Webhook</h2>
            <form onSubmit={createWebhook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Events
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-slate-800 p-4 rounded-lg">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                          } else {
                            setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(e => e !== event) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-300">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  Create Webhook
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
