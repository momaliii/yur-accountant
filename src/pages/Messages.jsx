import { useState, useEffect } from 'react';
import { Mail, Send, Search, User } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import apiClient from '../services/api/client';
import { useAuthStore } from '../stores/authStore';

export default function Messages() {
  const { user, isAdmin } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [newMessageForm, setNewMessageForm] = useState({
    toUserId: '',
    subject: '',
    content: '',
  });

  useEffect(() => {
    loadMessages();
    if (isAdmin()) {
      loadUsers();
    }
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get('/api/messages');
      // API returns { messages, unreadCount, total }
      const messagesList = Array.isArray(data) ? data : (data?.messages || []);
      setMessages(messagesList);
      if (messagesList.length > 0 && !selectedThread) {
        setSelectedThread(messagesList[0]._id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiClient.get('/api/admin/users');
      const usersList = Array.isArray(data) ? data : (data?.users || []);
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    try {
      const message = messages.find(m => m._id === selectedThread);
      const response = await apiClient.post('/api/messages', {
        toUserId: message.fromUserId._id === user.id ? message.toUserId._id : message.fromUserId._id,
        subject: `Re: ${message.subject}`,
        content: newMessage,
        threadId: message.threadId || message._id,
      });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendNewMessage = async (e) => {
    e.preventDefault();
    if (!newMessageForm.toUserId || !newMessageForm.content) return;

    try {
      await apiClient.post('/api/messages', {
        toUserId: newMessageForm.toUserId,
        subject: newMessageForm.subject || 'Message from Admin',
        content: newMessageForm.content,
      });
      setShowNewMessageModal(false);
      setNewMessageForm({ toUserId: '', subject: '', content: '' });
      loadMessages();
    } catch (error) {
      console.error('Error sending new message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const filteredMessages = messages.filter(m =>
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMessage = messages.find(m => m._id === selectedThread);

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
          <h1 className="text-3xl font-bold gradient-text">Messages</h1>
          <p className="text-slate-400 mt-1">
            {isAdmin() ? 'Communicate with users and team members' : 'Communicate with support and team members'}
          </p>
        </div>
        {isAdmin() && (
          <Button onClick={() => setShowNewMessageModal(true)} variant="primary" icon={Send}>
            New Message
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Search size={20} className="text-slate-400" />
              <Input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </Card>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <Mail size={32} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-slate-400">No messages</p>
                </div>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <Card
                  key={message._id}
                  className={`cursor-pointer transition-all ${
                    selectedThread === message._id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'hover:bg-slate-800'
                  } ${!message.read ? 'border-l-4 border-l-indigo-500' : ''}`}
                  onClick={() => setSelectedThread(message._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-white truncate">
                          {message.fromUserId?.email || 'Unknown'}
                        </p>
                        {!message.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 truncate">{message.subject}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Message View */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-white">{selectedMessage.subject}</h2>
                    <span className="text-sm text-slate-400">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 mb-4">
                    <User size={16} />
                    <span>From: {selectedMessage.fromUserId?.email || 'Unknown'}</span>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 min-h-[200px]">
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                <form onSubmit={sendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Reply
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={4}
                      placeholder="Type your reply..."
                    />
                  </div>
                  <Button type="submit" variant="primary" icon={Send}>
                    Send Reply
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Mail size={48} className="mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400">Select a message to view</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Message Modal (Admin Only) */}
      {showNewMessageModal && isAdmin() && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Send New Message</h2>
            <form onSubmit={sendNewMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  To User
                </label>
                <select
                  value={newMessageForm.toUserId}
                  onChange={(e) => setNewMessageForm({ ...newMessageForm, toUserId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  required
                >
                  <option value="">Select a user...</option>
                  {users.map((u) => (
                    <option key={u._id || u.id} value={u._id || u.id}>
                      {u.email} {u.profile?.name ? `(${u.profile.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={newMessageForm.subject}
                  onChange={(e) => setNewMessageForm({ ...newMessageForm, subject: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  placeholder="Message subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  value={newMessageForm.content}
                  onChange={(e) => setNewMessageForm({ ...newMessageForm, content: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  rows={6}
                  required
                  placeholder="Type your message..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" icon={Send}>
                  Send Message
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowNewMessageModal(false)}
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
