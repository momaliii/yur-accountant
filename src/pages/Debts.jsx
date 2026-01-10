import { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import currencyService from '../services/currency/currencyService';

const DEBT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'amber' },
  { value: 'partial', label: 'Partially Paid', color: 'cyan' },
  { value: 'paid', label: 'Paid', color: 'emerald' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
];

const initialFormState = {
  type: 'owed_to_me',
  partyName: '',
  amount: '',
  currency: 'EGP',
  dueDate: '',
  status: 'pending',
  notes: '',
};

export default function Debts() {
  const { debts, addDebt, updateDebt, deleteDebt } = useDataStore();
  const { baseCurrency, currencies, privacyMode, setPrivacyMode } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('owed_to_me');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter debts by type
  const filteredDebts = useMemo(() => {
    return debts
      .filter((d) => d.type === activeTab)
      .sort((a, b) => {
        // Sort by status (overdue first, then pending, then paid)
        const statusOrder = { overdue: 0, pending: 1, partial: 2, paid: 3 };
        return (statusOrder[a.status] || 1) - (statusOrder[b.status] || 1);
      });
  }, [debts, activeTab]);

  // Calculate totals
  const totals = useMemo(() => {
    const owedToMe = debts
      .filter((d) => d.type === 'owed_to_me' && d.status !== 'paid')
      .reduce((sum, d) => sum + d.amount, 0);

    const iOwe = debts
      .filter((d) => d.type === 'i_owe' && d.status !== 'paid')
      .reduce((sum, d) => sum + d.amount, 0);

    const overdue = debts.filter((d) => {
      if (d.status === 'paid') return false;
      if (!d.dueDate) return false;
      return new Date(d.dueDate) < new Date();
    }).length;

    return { owedToMe, iOwe, overdue };
  }, [debts]);

  const openAddModal = (type = activeTab) => {
    setEditingDebt(null);
    setFormData({ ...initialFormState, type });
    setIsModalOpen(true);
    
    // Scroll page to top when opening modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Ensure modal content scrolls to top
    setTimeout(() => {
      const modalContainer = document.querySelector('[data-modal-container]');
      const modalContent = document.querySelector('[data-modal-content]');
      if (modalContainer) {
        modalContainer.scrollTop = 0;
      }
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 200);
  };

  const openEditModal = (debt) => {
    setEditingDebt(debt);
    setFormData({
      type: debt.type || 'owed_to_me',
      partyName: debt.partyName || '',
      amount: debt.amount?.toString() || '',
      currency: debt.currency || 'EGP',
      dueDate: debt.dueDate || '',
      status: debt.status || 'pending',
      notes: debt.notes || '',
    });
    setIsModalOpen(true);
    
    // Scroll page to top and modal content to top when opened
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Multiple timeouts to ensure it works after all renders
    setTimeout(() => {
      const modalContainer = document.querySelector('[data-modal-container]');
      const modalContent = document.querySelector('[data-modal-content]');
      if (modalContainer) {
        modalContainer.scrollTop = 0;
      }
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 50);
    
    setTimeout(() => {
      const modalContainer = document.querySelector('[data-modal-container]');
      const modalContent = document.querySelector('[data-modal-content]');
      if (modalContainer) {
        modalContainer.scrollTop = 0;
      }
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const debtData = {
        type: formData.type,
        partyName: formData.partyName,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        dueDate: formData.dueDate || null,
        status: formData.status,
        notes: formData.notes,
      };

      if (editingDebt) {
        await updateDebt(editingDebt.id, debtData);
      } else {
        await addDebt(debtData);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to save debt:', error);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (debt) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteDebt(debt.id);
    }
  };

  const handleMarkPaid = async (debt) => {
    await updateDebt(debt.id, { status: 'paid' });
  };

  const handleDuplicate = (debt) => {
    // Copy debt data but reset status to pending and clear ID
    setEditingDebt(null); // This ensures we're in "add" mode, not "edit" mode
    setFormData({
      type: debt.type || 'owed_to_me',
      partyName: debt.partyName || '',
      amount: debt.amount?.toString() || '',
      currency: debt.currency || 'EGP',
      dueDate: debt.dueDate || '', // Keep the due date, user can change it
      status: 'pending', // Reset to pending for the duplicate
      notes: debt.notes || '',
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (amount, currency) =>
    currencyService.formatCurrency(amount, currency || baseCurrency);

  const getStatusInfo = (status) =>
    DEBT_STATUSES.find((s) => s.value === status) || DEBT_STATUSES[0];

  const isOverdue = (debt) => {
    if (debt.status === 'paid') return false;
    if (!debt.dueDate) return false;
    return new Date(debt.dueDate) < new Date();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Debts</h1>
          <p className="text-slate-400 mt-1">Track money owed and owing</p>
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
          <Button onClick={() => openAddModal()} icon={Plus}>
            Add Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-emerald-500">
          <div className="flex items-center gap-3">
            <ArrowDownRight className="text-emerald-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">Money Owed to You</p>
              <p className="text-2xl font-bold text-emerald-400">
                <PrivacyValue value={formatCurrency(totals.owedToMe, baseCurrency)} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <ArrowUpRight className="text-red-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">Money You Owe</p>
              <p className="text-2xl font-bold text-red-400">
                <PrivacyValue value={formatCurrency(totals.iOwe, baseCurrency)} />
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-400" size={24} />
            <div>
              <p className="text-slate-400 text-sm">Overdue Items</p>
              <p className="text-2xl font-bold text-amber-400">{totals.overdue}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('owed_to_me')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px
            ${activeTab === 'owed_to_me'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <div className="flex items-center gap-2">
            <ArrowDownRight size={18} />
            Owed to Me
          </div>
        </button>
        <button
          onClick={() => setActiveTab('i_owe')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px
            ${activeTab === 'i_owe'
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <div className="flex items-center gap-2">
            <ArrowUpRight size={18} />
            I Owe
          </div>
        </button>
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {filteredDebts.length > 0 ? (
          filteredDebts.map((debt) => {
            const statusInfo = getStatusInfo(debt.status);
            const overdue = isOverdue(debt);

            return (
              <Card
                key={debt.id}
                className={`${overdue ? 'border border-red-500/50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{debt.partyName}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs
                          bg-${statusInfo.color}-500/20 text-${statusInfo.color}-400`}
                      >
                        {statusInfo.label}
                      </span>
                      {overdue && debt.status !== 'paid' && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                      {debt.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          Due: {new Date(debt.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {debt.notes && (
                        <p className="text-slate-500">{debt.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xl font-bold ${
                        activeTab === 'owed_to_me' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      <PrivacyValue value={formatCurrency(debt.amount, debt.currency)} />
                    </p>
                    <div className="flex gap-2 mt-3 justify-end">
                      {debt.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkPaid(debt)}
                          className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 transition-colors"
                          title="Mark as paid"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(debt)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(debt)}
                        className="p-2 rounded-lg hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(debt)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="text-center py-12">
            {activeTab === 'owed_to_me' ? (
              <ArrowDownRight size={48} className="mx-auto mb-4 text-slate-600" />
            ) : (
              <ArrowUpRight size={48} className="mx-auto mb-4 text-slate-600" />
            )}
            <h3 className="text-lg font-medium text-slate-400 mb-2">
              No entries yet
            </h3>
            <p className="text-slate-500 mb-4">
              {activeTab === 'owed_to_me'
                ? 'Track money that clients or others owe you'
                : 'Track money you owe to subcontractors or vendors'}
            </p>
            <Button onClick={() => openAddModal()} icon={Plus}>
              Add Entry
            </Button>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDebt ? 'Edit Entry' : 'Add New Entry'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'owed_to_me' })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                ${formData.type === 'owed_to_me'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Owed to Me
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'i_owe' })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                ${formData.type === 'i_owe'
                  ? 'bg-red-500 text-white'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              I Owe
            </button>
          </div>

          <Input
            label={formData.type === 'owed_to_me' ? 'Who owes you? *' : 'Who do you owe? *'}
            value={formData.partyName}
            onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
            required
            placeholder="Client name or person/company"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount *"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {DEBT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional details..."
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {editingDebt ? 'Update Entry' : 'Add Entry'}
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

