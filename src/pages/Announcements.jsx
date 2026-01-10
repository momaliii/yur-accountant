import { useState, useEffect } from 'react';
import { Megaphone, Info, AlertCircle, CheckCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import apiClient from '../services/api/client';
import { useAuthStore } from '../stores/authStore';

export default function Announcements() {
  const { user, isAdmin } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    targetAudience: 'all',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      // Admin can see all announcements, regular users see only active ones
      const endpoint = isAdmin() ? '/api/announcements/all' : '/api/announcements';
      const data = await apiClient.get(endpoint);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const createAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/announcements', {
        ...newAnnouncement,
        isActive: true,
      });
      setShowCreateModal(false);
      setNewAnnouncement({
        title: '',
        content: '',
        type: 'info',
        priority: 'normal',
        targetAudience: 'all',
        startDate: '',
        endDate: '',
      });
      loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement. Please try again.');
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await apiClient.delete(`/api/announcements/${id}`);
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement. Please try again.');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info':
        return <Info size={20} className="text-blue-400" />;
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-400" />;
      case 'success':
        return <CheckCircle size={20} className="text-green-400" />;
      default:
        return <Megaphone size={20} className="text-indigo-400" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      default:
        return 'border-indigo-500/30 bg-indigo-500/10';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const activeAnnouncements = announcements.filter(a => a.isActive);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Announcements</h1>
          <p className="text-slate-400 mt-1">
            {isAdmin() ? 'Manage platform announcements' : 'Stay informed about platform updates and news'}
          </p>
        </div>
        {isAdmin() && (
          <Button onClick={() => setShowCreateModal(true)} variant="primary" icon={Plus}>
            Create Announcement
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {activeAnnouncements.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Megaphone size={48} className="mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No announcements at this time</p>
            </div>
          </Card>
        ) : (
          activeAnnouncements.map((announcement) => (
            <Card
              key={announcement._id}
              className={`border-l-4 ${getTypeColor(announcement.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(announcement.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                    {announcement.priority === 'high' && (
                      <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>
                  <div
                    className="text-slate-300 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                  <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    {announcement.endDate && (
                      <span>Active until: {new Date(announcement.endDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Announcement Modal (Admin Only) */}
      {showCreateModal && isAdmin() && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Announcement</h2>
            <form onSubmit={createAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  rows={6}
                  required
                  placeholder="Enter announcement content (HTML supported)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Type
                  </label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Audience
                </label>
                <select
                  value={newAnnouncement.targetAudience}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetAudience: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                >
                  <option value="all">All Users</option>
                  <option value="users">Regular Users Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newAnnouncement.startDate}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newAnnouncement.endDate}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" icon={Plus}>
                  Create Announcement
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
