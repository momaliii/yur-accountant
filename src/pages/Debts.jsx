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
  { value: 'partial', label: 'سداد جزئي', color: 'cyan' },
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
  paidAmount: 0,
};

export default function Debts() {
  const { debts, addDebt, updateDebt, deleteDebt } = useDataStore();
  const { baseCurrency, currencies, privacyMode, setPrivacyMode } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('owed_to_me');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
  const [partialPaymentError, setPartialPaymentError] = useState('');
  const [formError, setFormError] = useState('');
  const [editingDebt, setEditingDebt] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingPartial, setIsSubmittingPartial] = useState(false);

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

  // Calculate totals (accounting for partial payments)
  const totals = useMemo(() => {
    const owedToMe = debts
      .filter((d) => d.type === 'owed_to_me' && d.status !== 'paid')
      .reduce((sum, d) => {
        const paidAmount = d.paidAmount || 0;
        return sum + (d.amount - paidAmount);
      }, 0);

    const iOwe = debts
      .filter((d) => d.type === 'i_owe' && d.status !== 'paid')
      .reduce((sum, d) => {
        const paidAmount = d.paidAmount || 0;
        return sum + (d.amount - paidAmount);
      }, 0);

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
      paidAmount: debt.paidAmount || 0,
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
    setFormError('');

    try {
      const debtData = {
        type: formData.type,
        partyName: formData.partyName,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        dueDate: formData.dueDate || null,
        status: formData.status,
        notes: formData.notes,
        paidAmount: parseFloat(formData.paidAmount) || 0,
      };
      
      // Validate amount
      if (isNaN(debtData.amount) || debtData.amount <= 0) {
        setFormError('الرجاء إدخال مبلغ صحيح');
        setIsSubmitting(false);
        return;
      }

      // Validate paid amount doesn't exceed total amount
      if (debtData.paidAmount > debtData.amount) {
        setFormError('المبلغ المدفوع لا يمكن أن يتجاوز المبلغ الإجمالي');
        setIsSubmitting(false);
        return;
      }
      
      // Auto-update status based on paid amount
      if (debtData.paidAmount > 0 && debtData.paidAmount < debtData.amount) {
        debtData.status = 'partial';
      } else if (debtData.paidAmount >= debtData.amount) {
        debtData.status = 'paid';
        debtData.paidAmount = debtData.amount;
      }

      if (editingDebt) {
        await updateDebt(editingDebt.id, debtData);
      } else {
        await addDebt(debtData);
      }

      // Close modal only on success
      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingDebt(null);
      setFormError('');
    } catch (error) {
      console.error('Failed to save debt:', error);
      const errorMessage = error.message || 'فشل في حفظ الدين. الرجاء المحاولة مرة أخرى.';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (debt) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteDebt(debt.id);
    }
  };

  const handleMarkPaid = async (debt) => {
    await updateDebt(debt.id, { 
      status: 'paid',
      paidAmount: debt.amount 
    });
  };

  const handlePartialPayment = (debt) => {
    setSelectedDebt(debt);
    setPartialPaymentAmount('');
    setPartialPaymentError('');
    setIsPartialPaymentModalOpen(true);
  };

  const handleSubmitPartialPayment = async (e) => {
    e.preventDefault();
    if (!selectedDebt) return;

    setIsSubmittingPartial(true);
    setPartialPaymentError('');

    try {
      const paymentAmount = parseFloat(partialPaymentAmount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        setPartialPaymentError('الرجاء إدخال مبلغ صحيح للسداد');
        setIsSubmittingPartial(false);
        return;
      }

      const currentPaidAmount = selectedDebt.paidAmount || 0;
      const newPaidAmount = currentPaidAmount + paymentAmount;
      const remainingAmount = selectedDebt.amount - newPaidAmount;

      // Validate payment doesn't exceed remaining amount
      if (paymentAmount > remainingAmount) {
        setPartialPaymentError(`المبلغ المدخل يتجاوز المبلغ المتبقي (${formatCurrency(remainingAmount, selectedDebt.currency)})`);
        setIsSubmittingPartial(false);
        return;
      }

      let newStatus = 'partial';
      let finalPaidAmount = newPaidAmount;

      if (remainingAmount <= 0.01) { // Allow small rounding differences
        newStatus = 'paid';
        finalPaidAmount = selectedDebt.amount;
      }

      await updateDebt(selectedDebt.id, {
        paidAmount: finalPaidAmount,
        status: newStatus,
      });

      // Close modal only on success
      setIsPartialPaymentModalOpen(false);
      setSelectedDebt(null);
      setPartialPaymentAmount('');
      setPartialPaymentError('');
    } catch (error) {
      console.error('Failed to record partial payment:', error);
      const errorMessage = error.message || 'فشل في تسجيل السداد. الرجاء المحاولة مرة أخرى.';
      setPartialPaymentError(errorMessage);
    } finally {
      setIsSubmittingPartial(false);
    }
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
      paidAmount: 0, // Reset paid amount for duplicate
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

            const paidAmount = debt.paidAmount || 0;
            const remainingAmount = debt.amount - paidAmount;
            const isPartiallyPaid = paidAmount > 0 && paidAmount < debt.amount;

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

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-2">
                      {debt.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          Due: {new Date(debt.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {isPartiallyPaid && (
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Clock size={14} />
                          Paid: {formatCurrency(paidAmount, debt.currency)} / {formatCurrency(debt.amount, debt.currency)}
                        </div>
                      )}
                    </div>
                    {debt.notes && (
                      <p className="text-slate-500 text-sm">{debt.notes}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Total Amount</p>
                      <p
                        className={`text-xl font-bold ${
                          activeTab === 'owed_to_me' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        <PrivacyValue value={formatCurrency(debt.amount, debt.currency)} />
                      </p>
                      {isPartiallyPaid && (
                        <>
                          <p className="text-xs text-slate-400 mt-2 mb-1">Remaining</p>
                          <p className="text-lg font-semibold text-amber-400">
                            <PrivacyValue value={formatCurrency(remainingAmount, debt.currency)} />
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3 justify-end">
                      {debt.status !== 'paid' && (
                        <>
                          <button
                            onClick={() => handlePartialPayment(debt)}
                            className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 transition-colors"
                            title="سداد جزئي / Partial Payment"
                          >
                            <Clock size={16} />
                          </button>
                          <button
                            onClick={() => handleMarkPaid(debt)}
                            className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 transition-colors"
                            title="Mark as paid"
                          >
                            <CheckCircle size={16} />
                          </button>
                        </>
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
            onChange={(e) => {
              setFormData({ ...formData, notes: e.target.value });
              setFormError(''); // Clear error when user types
            }}
            placeholder="Any additional details..."
          />

          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={isSubmitting} className="flex-1" disabled={isSubmitting}>
              {editingDebt ? 'تحديث / Update Entry' : 'إضافة / Add Entry'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setFormError('');
              }}
              disabled={isSubmitting}
            >
              إلغاء / Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Partial Payment Modal */}
      <Modal
        isOpen={isPartialPaymentModalOpen}
        onClose={() => {
          setIsPartialPaymentModalOpen(false);
          setSelectedDebt(null);
          setPartialPaymentAmount('');
        }}
        title="سداد جزئي / Partial Payment"
        size="md"
      >
        {selectedDebt && (
          <form onSubmit={handleSubmitPartialPayment} className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Amount:</span>
                <span className="font-semibold">{formatCurrency(selectedDebt.amount, selectedDebt.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Already Paid:</span>
                <span className="text-cyan-400">{formatCurrency(selectedDebt.paidAmount || 0, selectedDebt.currency)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                <span className="text-slate-400">Remaining:</span>
                <span className="text-amber-400 font-semibold">
                  {formatCurrency(selectedDebt.amount - (selectedDebt.paidAmount || 0), selectedDebt.currency)}
                </span>
              </div>
            </div>

            <Input
              label="Payment Amount *"
              type="number"
              step="0.01"
              min="0.01"
              max={selectedDebt.amount - (selectedDebt.paidAmount || 0)}
              value={partialPaymentAmount}
              onChange={(e) => setPartialPaymentAmount(e.target.value)}
              required
              placeholder="Enter payment amount"
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={isSubmittingPartial} className="flex-1" disabled={isSubmittingPartial}>
                تسجيل السداد / Record Payment
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsPartialPaymentModalOpen(false);
                  setSelectedDebt(null);
                  setPartialPaymentAmount('');
                  setPartialPaymentError('');
                }}
                disabled={isSubmittingPartial}
              >
                إلغاء / Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

