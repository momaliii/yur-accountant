import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingDown,
  Calendar,
  Tag,
  RefreshCw,
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
import aiService from '../services/ai/aiService';

const CATEGORIES = [
  { value: 'subscriptions', label: 'Subscriptions', color: 'indigo' },
  { value: 'fees', label: 'Fees', color: 'red' },
  { value: 'tools', label: 'Tools', color: 'cyan' },
  { value: 'salaries', label: 'Salaries/Payroll', color: 'amber' },
  { value: 'outsourcing', label: 'Outsourcing', color: 'orange' },
  { value: 'advertising', label: 'Advertising', color: 'pink' },
  { value: 'rent', label: 'Rent', color: 'blue' },
  { value: 'utilities', label: 'Utilities (Water/Electric/Gas)', color: 'teal' },
  { value: 'internet', label: 'Internet/Phone', color: 'violet' },
  { value: 'transportation', label: 'Transportation (Uber/Didi)', color: 'rose' },
  { value: 'office', label: 'Office Supplies', color: 'emerald' },
  { value: 'travel', label: 'Travel', color: 'purple' },
  { value: 'other', label: 'Other', color: 'slate' },
];

// Color mapping for Tailwind classes
const CATEGORY_COLORS = {
  indigo: 'bg-indigo-500/20 text-indigo-300',
  red: 'bg-red-500/20 text-red-300',
  cyan: 'bg-cyan-500/20 text-cyan-300',
  amber: 'bg-amber-500/20 text-amber-300',
  orange: 'bg-orange-500/20 text-orange-300',
  pink: 'bg-pink-500/20 text-pink-300',
  blue: 'bg-blue-500/20 text-blue-300',
  teal: 'bg-teal-500/20 text-teal-300',
  violet: 'bg-violet-500/20 text-violet-300',
  rose: 'bg-rose-500/20 text-rose-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
  purple: 'bg-purple-500/20 text-purple-300',
  slate: 'bg-slate-500/20 text-slate-300',
};

const initialFormState = {
  clientId: '',
  amount: '',
  currency: 'EGP',
  category: 'other',
  description: '',
  date: new Date().toISOString().split('T')[0],
  isRecurring: false,
  notes: '',
  taxCategory: null,
  isTaxDeductible: false,
  taxRate: null,
};

export default function Expenses() {
  const { clients, expenses, addExpense, updateExpense, deleteExpense } = useDataStore();
  const { baseCurrency, currencies, openaiApiKey, exchangeRates, privacyMode, setPrivacyMode } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizng, setIsCategorizng] = useState(false);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory && e.category !== filterCategory) return false;
      if (showRecurringOnly && !e.isRecurring) return false;

      if (filterMonth) {
        const expenseDate = new Date(e.date);
        const [year, month] = filterMonth.split('-');
        if (
          expenseDate.getFullYear() !== parseInt(year) ||
          expenseDate.getMonth() !== parseInt(month) - 1
        )
          return false;
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          e.description?.toLowerCase().includes(searchLower) ||
          e.notes?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [expenses, filterCategory, filterMonth, showRecurringOnly, searchQuery]);

  // Calculate totals by category (converted to base currency)
  const categoryTotals = useMemo(() => {
    const totals = {};
    filteredExpenses.forEach((e) => {
      const converted = currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
      totals[e.category] = (totals[e.category] || 0) + converted;
    });
    return totals;
  }, [filteredExpenses, baseCurrency, exchangeRates]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => {
      const converted = currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
      return sum + converted;
    }, 0);
  }, [filteredExpenses, baseCurrency, exchangeRates]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      ...initialFormState,
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      clientId: expense.clientId?.toString() || '',
      amount: expense.amount?.toString() || '',
      currency: expense.currency || 'EGP',
      category: expense.category || 'other',
      description: expense.description || '',
      date: expense.date || new Date().toISOString().split('T')[0],
      isRecurring: expense.isRecurring || false,
      notes: expense.notes || '',
      taxCategory: expense.taxCategory || null,
      isTaxDeductible: expense.isTaxDeductible || false,
      taxRate: expense.taxRate?.toString() || '',
    });
    setIsModalOpen(true);
  };

  const handleAutoCategorizize = async () => {
    if (!formData.description || !openaiApiKey) return;

    setIsCategorizng(true);
    try {
      const category = await aiService.categorizeExpense(
        formData.description,
        openaiApiKey
      );
      const normalizedCategory = category.toLowerCase().trim();
      const matchedCategory = CATEGORIES.find(
        (c) => c.value === normalizedCategory || c.label.toLowerCase() === normalizedCategory
      );
      if (matchedCategory) {
        setFormData({ ...formData, category: matchedCategory.value });
      }
    } catch (error) {
      console.error('Auto-categorization failed:', error);
    }
    setIsCategorizng(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const expenseData = {
        clientId: formData.clientId ? parseInt(formData.clientId) : null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        isRecurring: formData.isRecurring,
        notes: formData.notes,
        taxCategory: formData.taxCategory || null,
        isTaxDeductible: formData.isTaxDeductible || false,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : null,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to save expense:', error);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (expense) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(expense.id);
    }
  };

  const formatCurrency = (amount, currency) =>
    currencyService.formatCurrency(amount, currency || baseCurrency);

  const getCategoryInfo = (category) =>
    CATEGORIES.find((c) => c.value === category) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Expenses</h1>
          <p className="text-slate-400 mt-1">Track your business expenses</p>
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
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3">
        {CATEGORIES.map((cat) => (
          <Card
            key={cat.value}
            className={`cursor-pointer transition-all ${
              filterCategory === cat.value ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() =>
              setFilterCategory(filterCategory === cat.value ? '' : cat.value)
            }
          >
            <p className="text-xs text-slate-400 truncate">{cat.label}</p>
            <p className="text-sm sm:text-base md:text-lg font-bold truncate">
              <PrivacyValue value={formatCurrency(categoryTotals[cat.value] || 0, baseCurrency)} />
            </p>
          </Card>
        ))}
      </div>

      {/* Total */}
      <Card className="border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Total Expenses</p>
            <p className="text-3xl font-bold text-red-400">
              <PrivacyValue value={formatCurrency(totalExpenses, baseCurrency)} />
            </p>
          </div>
          <TrendingDown size={40} className="text-red-400 opacity-50" />
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="flex-1 min-w-0">
          <Input
            icon={Search}
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[150px]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[150px]"
        />
        <label className="flex items-center gap-2 cursor-pointer px-2 py-2 sm:py-0">
          <input
            type="checkbox"
            checked={showRecurringOnly}
            onChange={(e) => setShowRecurringOnly(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-slate-300 whitespace-nowrap">Recurring only</span>
        </label>
      </div>

      {/* Expenses Table */}
      <Card padding={false}>
        <div className="overflow-x-auto -mx-6 lg:mx-0">
          <table className="w-full min-w-[600px]">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Date</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">
                  Description
                </th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400 hidden sm:table-cell">Category</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Amount</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => {
                  const catInfo = getCategoryInfo(expense.category);
                  return (
                    <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 md:p-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-500 md:hidden" />
                          <span className="text-xs md:text-sm">
                            <span className="md:hidden">
                              {new Date(expense.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </span>
                            <span className="hidden md:inline">
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                          </span>
                          {expense.isRecurring && (
                            <RefreshCw size={12} className="text-indigo-400 md:w-3.5 md:h-3.5" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 md:p-4">
                        <p className="font-medium text-xs md:text-sm truncate max-w-[150px] md:max-w-none">{expense.description || 'No description'}</p>
                        {expense.notes && (
                          <p className="text-xs text-slate-500 truncate max-w-[150px] md:max-w-xs mt-1">
                            {expense.notes}
                          </p>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1 sm:hidden
                          ${CATEGORY_COLORS[catInfo.color] || CATEGORY_COLORS.slate}`}>
                          <Tag size={10} />
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="p-3 md:p-4 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                            ${CATEGORY_COLORS[catInfo.color] || CATEGORY_COLORS.slate}`}
                        >
                          <Tag size={12} />
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="p-3 md:p-4 text-right">
                        <span className="font-medium text-xs md:text-sm text-red-400">
                          <PrivacyValue value={formatCurrency(expense.amount, expense.currency)} />
                        </span>
                      </td>
                      <td className="p-3 md:p-4">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors"
                            aria-label="Edit"
                          >
                            <Edit2 size={14} className="md:w-4 md:h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            className="p-1.5 md:p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 size={14} className="md:w-4 md:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <TrendingDown size={40} className="mx-auto mb-2 opacity-50" />
                    <p>No expenses found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Description *"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  placeholder="What was this expense for?"
                />
              </div>
              {openaiApiKey && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAutoCategorizize}
                  loading={isCategorizng}
                  disabled={!formData.description}
                >
                  Auto
                </Button>
              )}
            </div>
          </div>

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
            <Select
              label="Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Input
              label="Date *"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <Select
            label="Related Client (optional)"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          >
            <option value="">General business expense</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData({ ...formData, isRecurring: e.target.checked })
              }
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-slate-300">This is a recurring expense</span>
          </label>

          {/* Tax Information */}
          <div className="pt-2 border-t border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Tax Information (Optional)
            </h3>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <input
                type="checkbox"
                id="isTaxDeductible"
                checked={formData.isTaxDeductible}
                onChange={(e) => setFormData((prev) => ({ ...prev, isTaxDeductible: e.target.checked }))}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-2"
              />
              <label htmlFor="isTaxDeductible" className="text-sm text-slate-300 cursor-pointer flex-1">
                This expense is tax deductible
              </label>
            </div>
            {formData.isTaxDeductible && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Tax Category (Optional)"
                  value={formData.taxCategory || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, taxCategory: e.target.value || null }))}
                >
                  <option value="">Select category</option>
                  <option value="office_supplies">Office Supplies</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent</option>
                  <option value="travel">Travel</option>
                  <option value="professional_services">Professional Services</option>
                  <option value="software_subscriptions">Software/Subscriptions</option>
                  <option value="marketing">Marketing & Advertising</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </Select>
                <Input
                  label="Tax Rate % (Optional)"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxRate || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, taxRate: e.target.value }))}
                  placeholder="e.g., 14 for 14%"
                />
              </div>
            )}
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {editingExpense ? 'Update Expense' : 'Add Expense'}
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

