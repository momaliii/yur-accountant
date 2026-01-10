import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import apiClient from '../services/api/client';
import { useAuthStore } from '../stores/authStore';

export default function Notifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { read: filter === 'read' } : {};
      const data = await apiClient.get('/api/notifications', { params });
      // API returns { notifications, unreadCount, total }
      setNotifications(Array.isArray(data) ? data : (data?.notifications || []));
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      // Notify header to update count
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const notification = notifications.find(n => n._id === id);
      await apiClient.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      // If deleted notification was unread, update header count
      if (notification && !notification.read) {
        window.dispatchEvent(new Event('notificationUpdated'));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
      await Promise.all(unreadIds.map(id => apiClient.put(`/api/notifications/${id}/read`)));
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      // Notify header to update count
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

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
          <h1 className="text-3xl font-bold gradient-text">Notifications</h1>
          <p className="text-slate-400 mt-1">Stay updated with your account activity</p>
        </div>
        {notifications.filter(n => !n.read).length > 0 && (
          <Button onClick={markAllAsRead} variant="secondary">
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-slate-400" />
          <div className="flex gap-2">
            {['all', 'unread', 'read'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No notifications found</p>
            </div>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification._id}
              className={`transition-all ${
                !notification.read ? 'border-l-4 border-l-indigo-500 bg-indigo-500/5' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{notification.title}</h3>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    )}
                  </div>
                  <p className="text-slate-300 mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    {notification.type && (
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs">
                        {notification.type}
                      </span>
                    )}
                  </div>
                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block"
                    >
                      View details →
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <Button
                      onClick={() => markAsRead(notification._id)}
                      variant="secondary"
                      size="sm"
                      icon={Check}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    onClick={() => deleteNotification(notification._id)}
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
    </div>
  );
}
