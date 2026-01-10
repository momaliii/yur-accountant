import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  TrendingUp,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import currencyService from '../services/currency/currencyService';

const PAYMENT_MODELS = [
  { value: 'fixed', label: 'Fixed Salary' },
  { value: 'fixed_plus_percent', label: 'Fixed + % of Ad Spend' },
  { value: 'percent_only', label: '% of Ad Spend Only' },
  { value: 'commission', label: 'Commission (Outsourcing)' },
  { value: 'per_project', label: 'Per Project' },
];

const SERVICES = [
  { value: 'fb_ads', label: 'Facebook/Meta Ads' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'tiktok_ads', label: 'TikTok Ads' },
  { value: 'strategy', label: 'Marketing Strategy' },
  { value: 'creative', label: 'Creative/Content' },
];

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  paymentModel: 'fixed',
  fixedAmount: '',
  adSpendPercentage: '',
  subcontractorCost: '',
  currency: 'EGP',
  services: [],
  notes: '',
  rating: 3,
  riskLevel: 'medium',
  status: 'active',
};

export default function Clients() {
  const { clients, income, addClient, updateClient, deleteClient } = useDataStore();
  const { baseCurrency, currencies, privacyMode, setPrivacyMode } = useSettingsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'hold'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClients = useMemo(() => {
    let filtered = clients;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => (c.status || 'active') === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [clients, searchQuery, statusFilter]);

  // Calculate client earnings
  const clientEarnings = useMemo(() => {
    const earnings = {};
    income.forEach((i) => {
      if (i.clientId) {
        earnings[i.clientId] = (earnings[i.clientId] || 0) + (i.netAmount || i.amount);
      }
    });
    return earnings;
  }, [income]);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      paymentModel: client.paymentModel || 'fixed',
      fixedAmount: client.fixedAmount?.toString() || '',
      adSpendPercentage: client.adSpendPercentage?.toString() || '',
      subcontractorCost: client.subcontractorCost?.toString() || '',
      currency: client.currency || 'EGP',
      services: client.services || [],
      notes: client.notes || '',
      rating: client.rating || 3,
      riskLevel: client.riskLevel || 'medium',
      status: client.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const clientData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        paymentModel: formData.paymentModel,
        fixedAmount: formData.fixedAmount ? parseFloat(formData.fixedAmount) : null,
        adSpendPercentage: formData.adSpendPercentage
          ? parseFloat(formData.adSpendPercentage)
          : null,
        subcontractorCost: formData.subcontractorCost
          ? parseFloat(formData.subcontractorCost)
          : null,
        currency: formData.currency,
        services: formData.services,
        notes: formData.notes,
        rating: formData.rating,
        riskLevel: formData.riskLevel,
        status: formData.status,
      };

      if (editingClient) {
        await updateClient(editingClient.id, clientData);
      } else {
        await addClient(clientData);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to save client:', error);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (client) => {
    if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
      await deleteClient(client.id);
    }
  };

  const toggleService = (service) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const formatCurrency = (amount, currency) =>
    currencyService.formatCurrency(amount, currency || baseCurrency);

  const getPaymentModelLabel = (model) =>
    PAYMENT_MODELS.find((m) => m.value === model)?.label || model;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Clients</h1>
          <p className="text-slate-400 mt-1">
            Manage your clients and their payment arrangements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
            title={privacyMode ? 'Show data' : 'Hide data'}
            aria-label={privacyMode ? 'Show data' : 'Hide data'}
          >
            {privacyMode ? (
              <EyeOff size={20} className="text-slate-400" />
            ) : (
              <Eye size={20} className="text-slate-400" />
            )}
          </button>
          <Button onClick={openAddModal} icon={Plus}>
            Add Client
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="max-w-md flex-1">
          <Input
            icon={Search}
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Clients</option>
            <option value="active">Active</option>
            <option value="hold">On Hold</option>
          </Select>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} hover className="relative group">
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(client)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Client Info */}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                  (client.status || 'active') === 'hold' 
                    ? 'bg-gradient-to-br from-slate-500 to-slate-600 opacity-60' 
                    : 'bg-gradient-to-br from-indigo-500 to-cyan-500'
                }`}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-semibold text-lg truncate ${
                      (client.status || 'active') === 'hold' ? 'text-slate-400' : ''
                    }`}>
                      {client.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      (client.status || 'active') === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {(client.status || 'active') === 'active' ? 'Active' : 'On Hold'}
                    </span>
                  </div>
                  {client.email && (
                    <p className="text-sm text-slate-400 truncate">{client.email}</p>
                  )}
                </div>
              </div>

              {/* Payment Model */}
              <div className="mt-4 p-3 rounded-lg bg-white/5">
                <p className="text-xs text-slate-500 mb-1">Payment Model</p>
                <p className="text-sm font-medium">
                  {getPaymentModelLabel(client.paymentModel)}
                </p>
                {client.fixedAmount && (
                  <p className="text-sm text-slate-400">
                    Fixed: {formatCurrency(client.fixedAmount, client.currency)}
                  </p>
                )}
                {client.adSpendPercentage && (
                  <p className="text-sm text-slate-400">
                    Ad Spend: {client.adSpendPercentage}%
                  </p>
                )}
                {client.paymentModel === 'commission' && client.subcontractorCost && (
                  <p className="text-sm text-slate-400">
                    Subcontractor: {formatCurrency(client.subcontractorCost, client.currency)}
                  </p>
                )}
                {client.paymentModel === 'per_project' && (
                  <p className="text-sm text-indigo-400">
                    💼 Payment per project basis
                  </p>
                )}
              </div>

              {/* Services */}
              {client.services?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {client.services.map((service) => (
                    <span
                      key={service}
                      className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300"
                    >
                      {SERVICES.find((s) => s.value === service)?.label || service}
                    </span>
                  ))}
                </div>
              )}

              {/* Earnings */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingUp size={18} />
                  <span className="font-semibold">
                    <PrivacyValue value={formatCurrency(clientEarnings[client.id] || 0, baseCurrency)} />
                  </span>
                </div>
                <span className="text-xs text-slate-500">Total Earned</span>
              </div>

              {/* View Details Link */}
              <Link to={`/clients/${client.id}`}>
                <Button
                  variant="secondary"
                  className="w-full mt-4 flex items-center justify-center gap-2"
                >
                  View Details
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Users size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">
            {searchQuery ? 'No clients found' : 'No clients yet'}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchQuery
              ? 'Try a different search term'
              : 'Add your first client to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={openAddModal} icon={Plus}>
              Add Client
            </Button>
          )}
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Client' : 'Add New Client'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Information */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Client Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Payment Configuration */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Payment Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Payment Model *"
                value={formData.paymentModel}
                onChange={(e) => setFormData({ ...formData, paymentModel: e.target.value })}
              >
                {PAYMENT_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </Select>

              <Select
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>

            {/* Conditional fields based on payment model */}
            <div className="space-y-4">
              {(formData.paymentModel === 'fixed' ||
                formData.paymentModel === 'fixed_plus_percent' ||
                formData.paymentModel === 'commission') && (
                <Input
                  label="Fixed Amount *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fixedAmount}
                  onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
                  placeholder="Enter fixed amount"
                  required={
                    formData.paymentModel === 'fixed' || formData.paymentModel === 'commission'
                  }
                />
              )}

              {(formData.paymentModel === 'fixed_plus_percent' ||
                formData.paymentModel === 'percent_only') && (
                <Input
                  label="Ad Spend Percentage (%) *"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.adSpendPercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, adSpendPercentage: e.target.value })
                  }
                  placeholder="e.g., 10 for 10%"
                  required
                />
              )}

              {formData.paymentModel === 'commission' && (
                <Input
                  label="Subcontractor Cost *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.subcontractorCost}
                  onChange={(e) =>
                    setFormData({ ...formData, subcontractorCost: e.target.value })
                  }
                  placeholder="Amount you pay to subcontractor"
                  required
                />
              )}

              {formData.paymentModel === 'commission' && formData.fixedAmount && formData.subcontractorCost && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-sm text-indigo-300">
                    <span className="font-semibold">Your Commission:</span>{' '}
                    {formatCurrency(
                      parseFloat(formData.fixedAmount || 0) - parseFloat(formData.subcontractorCost || 0),
                      formData.currency
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="pt-2 border-t border-white/10">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Services Provided
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((service) => (
                <button
                  key={service.value}
                  type="button"
                  onClick={() => toggleService(service.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors
                    ${formData.services.includes(service.value)
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                >
                  {service.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating & Risk Assessment */}
          <div className="pt-2 border-t border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Assessment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rating (1-5)
                </label>
                <Select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r} {r === 1 ? 'Star' : 'Stars'}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Risk Level
                </label>
                <Select
                  value={formData.riskLevel}
                  onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="pt-2 border-t border-white/10">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Client Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="hold">On Hold</option>
            </Select>
            <p className="text-xs text-slate-400 mt-2">
              {formData.status === 'active' 
                ? 'Client is currently active and receiving services' 
                : 'Client is on hold - temporarily inactive'}
            </p>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-white/10">
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this client..."
              className="min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

