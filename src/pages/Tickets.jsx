import { useState, useEffect } from 'react';
import { Ticket, Plus, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import apiClient from '../services/api/client';
import { useAuthStore } from '../stores/authStore';

export default function Tickets() {
  const { user, isAdmin } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all'); // all, open, in_progress, resolved, closed
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: 'general' });

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      // Admin sees all tickets, regular users see only their own
      const endpoint = isAdmin() ? '/api/tickets/all' : '/api/tickets';
      const data = await apiClient.get(endpoint, { params });
      // API returns { tickets, total }
      setTickets(Array.isArray(data) ? data : (data?.tickets || []));
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/tickets', newTicket);
      setShowCreateModal(false);
      setNewTicket({ subject: '', description: '', category: 'general' });
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await apiClient.put(`/api/tickets/${id}`, { status });
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'in_progress':
        return <Clock size={16} className="text-yellow-400" />;
      default:
        return <Ticket size={16} className="text-blue-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter);

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
          <h1 className="text-3xl font-bold gradient-text">Support Tickets</h1>
          <p className="text-slate-400 mt-1">
            {isAdmin() ? 'Manage all support tickets' : 'Get help with your account and issues'}
          </p>
        </div>
        {!isAdmin() && (
          <Button onClick={() => setShowCreateModal(true)} variant="primary" icon={Plus}>
            Create Ticket
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-slate-400" />
          <div className="flex gap-2 flex-wrap">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Ticket size={48} className="mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No tickets found</p>
            </div>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(ticket.status)}
                    <h3 className="font-semibold text-white">{ticket.subject}</h3>
                    <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {ticket.priority && (
                      <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                        {ticket.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 mb-2">{ticket.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>#{ticket._id.slice(-6)}</span>
                    <span>{ticket.category}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    {isAdmin() && ticket.userId && (
                      <span>From: {ticket.userId.email || ticket.userId}</span>
                    )}
                    {ticket.assignedTo && (
                      <span>Assigned to: {ticket.assignedTo.email || ticket.assignedTo}</span>
                    )}
                  </div>
                </div>
                {isAdmin() && ticket.status === 'open' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateTicketStatus(ticket._id, 'in_progress')}
                      variant="secondary"
                      size="sm"
                    >
                      Start
                    </Button>
                    <Button
                      onClick={() => updateTicketStatus(ticket._id, 'resolved')}
                      variant="primary"
                      size="sm"
                    >
                      Resolve
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Create Support Ticket</h2>
            <form onSubmit={createTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                >
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                  rows={6}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  Create Ticket
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
