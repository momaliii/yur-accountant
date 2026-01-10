import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Target,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
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

const GOAL_TYPES = [
  { value: 'income', label: 'Income Goal', icon: TrendingUp, color: 'emerald' },
  { value: 'expense', label: 'Expense Budget', icon: TrendingDown, color: 'red' },
  { value: 'profit', label: 'Profit Goal', icon: Target, color: 'indigo' },
];

// Color mapping for Tailwind classes
const GOAL_COLORS = {
  emerald: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  red: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
  },
  indigo: {
    bg: 'bg-indigo-500/20',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
  },
};

const PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const initialFormState = {
  type: 'income',
  targetAmount: '',
  period: 'monthly',
  periodValue: null, // null for current period, or specific month/year
  category: null, // null for all, or specific category for expenses
  notes: '',
};

export default function Goals() {
  const { goals, income, expenses, addGoal, updateGoal, deleteGoal, updateGoalProgress } = useDataStore();
  const { baseCurrency, exchangeRates, privacyMode, setPrivacyMode } = useSettingsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate current progress for each goal
  const goalsWithProgress = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;

    return goals.map((goal) => {
      let currentAmount = 0;
      let periodStart, periodEnd;

      // Determine period dates
      if (goal.period === 'monthly') {
        const year = goal.periodValue?.year || currentYear;
        const month = goal.periodValue?.month !== undefined ? goal.periodValue.month : currentMonth;
        periodStart = new Date(year, month, 1);
        periodEnd = new Date(year, month + 1, 0, 23, 59, 59);
      } else if (goal.period === 'quarterly') {
        const year = goal.periodValue?.year || currentYear;
        const quarter = goal.periodValue?.quarter || currentQuarter;
        const startMonth = (quarter - 1) * 3;
        periodStart = new Date(year, startMonth, 1);
        periodEnd = new Date(year, startMonth + 3, 0, 23, 59, 59);
      } else {
        // yearly
        const year = goal.periodValue?.year || currentYear;
        periodStart = new Date(year, 0, 1);
        periodEnd = new Date(year, 11, 31, 23, 59, 59);
      }

      // Calculate current amount based on goal type
      if (goal.type === 'income') {
        const periodIncome = income.filter((i) => {
          const date = new Date(i.receivedDate);
          return date >= periodStart && date <= periodEnd;
        });
        currentAmount = periodIncome.reduce((sum, i) => {
          const amount = i.netAmount || i.amount;
          return sum + currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
        }, 0);
      } else if (goal.type === 'expense') {
        let periodExpenses = expenses.filter((e) => {
          const date = new Date(e.date);
          return date >= periodStart && date <= periodEnd;
        });
        
        // Filter by category if specified
        if (goal.category) {
          periodExpenses = periodExpenses.filter((e) => e.category === goal.category);
        }
        
        currentAmount = periodExpenses.reduce((sum, e) => {
          return sum + currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
        }, 0);
      } else if (goal.type === 'profit') {
        const periodIncome = income.filter((i) => {
          const date = new Date(i.receivedDate);
          return date >= periodStart && date <= periodEnd;
        });
        const periodExpenses = expenses.filter((e) => {
          const date = new Date(e.date);
          return date >= periodStart && date <= periodEnd;
        });
        
        const totalIncome = periodIncome.reduce((sum, i) => {
          const amount = i.netAmount || i.amount;
          return sum + currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
        }, 0);
        
        const totalExpenses = periodExpenses.reduce((sum, e) => {
          return sum + currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
        }, 0);
        
        currentAmount = totalIncome - totalExpenses;
      }

      const progress = Math.min((currentAmount / goal.targetAmount) * 100, 100);
      const isAchieved = currentAmount >= goal.targetAmount;
      const remaining = Math.max(goal.targetAmount - currentAmount, 0);

      return {
        ...goal,
        currentAmount,
        progress,
        isAchieved,
        remaining,
        periodStart,
        periodEnd,
      };
    });
  }, [goals, income, expenses, baseCurrency, exchangeRates]);

  // Update goal progress in database (only when it changes)
  useEffect(() => {
    goalsWithProgress.forEach((goal) => {
      const existingGoal = goals.find((g) => g.id === goal.id);
      if (existingGoal && existingGoal.currentAmount !== goal.currentAmount) {
        updateGoalProgress(goal.id, goal.currentAmount);
      }
    });
  }, [goalsWithProgress, goals, updateGoalProgress]);

  const openAddModal = () => {
    setEditingGoal(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setFormData({
      type: goal.type,
      targetAmount: goal.targetAmount?.toString() || '',
      period: goal.period || 'monthly',
      periodValue: goal.periodValue || null,
      category: goal.category || null,
      notes: goal.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const goalData = {
        type: formData.type,
        targetAmount: parseFloat(formData.targetAmount),
        period: formData.period,
        periodValue: formData.periodValue,
        category: formData.category || null,
        notes: formData.notes,
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, goalData);
      } else {
        await addGoal(goalData);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to save goal:', error);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (goal) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(goal.id);
    }
  };

  const formatCurrency = (amount) => currencyService.formatCurrency(amount, baseCurrency);

  const formatPeriod = (goal) => {
    if (goal.period === 'monthly') {
      if (goal.periodValue?.month !== undefined) {
        const date = new Date(goal.periodValue.year || new Date().getFullYear(), goal.periodValue.month, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      return 'Current Month';
    } else if (goal.period === 'quarterly') {
      if (goal.periodValue?.quarter) {
        return `Q${goal.periodValue.quarter} ${goal.periodValue.year || new Date().getFullYear()}`;
      }
      return 'Current Quarter';
    } else {
      if (goal.periodValue?.year) {
        return goal.periodValue.year.toString();
      }
      return 'Current Year';
    }
  };

  const getGoalTypeInfo = (type) => GOAL_TYPES.find((t) => t.value === type) || GOAL_TYPES[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Goals & Budgets</h1>
          <p className="text-slate-400 mt-1">Set and track your financial goals</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
            title={privacyMode ? 'Show data' : 'Hide data'}
          >
            {privacyMode ? (
              <EyeOff size={20} className="text-slate-400" />
            ) : (
              <Eye size={20} className="text-slate-400" />
            )}
          </button>
          <Button onClick={openAddModal} icon={Plus}>
            Add Goal
          </Button>
        </div>
      </div>

      {/* Goals Grid */}
      {goalsWithProgress.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goalsWithProgress.map((goal) => {
            const typeInfo = getGoalTypeInfo(goal.type);
            const Icon = typeInfo.icon;

            return (
              <Card key={goal.id} hover className="relative group">
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(goal)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(goal)}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Goal Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${GOAL_COLORS[typeInfo.color].bg} border ${GOAL_COLORS[typeInfo.color].border}`}>
                    <Icon className={GOAL_COLORS[typeInfo.color].text} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{typeInfo.label}</h3>
                    <p className="text-sm text-slate-400">{formatPeriod(goal)}</p>
                    {goal.category && (
                      <p className="text-xs text-slate-500 mt-1">Category: {goal.category}</p>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Progress</span>
                    <span className={`text-sm font-semibold ${goal.isAchieved ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {goal.progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        goal.isAchieved
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : goal.progress >= 75
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-500'
                          : goal.progress >= 50
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                          : 'bg-gradient-to-r from-red-500 to-orange-500'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Amounts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Current</span>
                    <span className="font-semibold text-white">
                      <PrivacyValue value={formatCurrency(goal.currentAmount)} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Target</span>
                    <span className="font-semibold text-slate-300">
                      <PrivacyValue value={formatCurrency(goal.targetAmount)} />
                    </span>
                  </div>
                  {!goal.isAchieved && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-sm text-slate-400">Remaining</span>
                      <span className="font-semibold text-amber-400">
                        <PrivacyValue value={formatCurrency(goal.remaining)} />
                      </span>
                    </div>
                  )}
                </div>

                {/* Achievement Badge */}
                {goal.isAchieved && (
                  <div className="mt-4 p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="text-sm text-emerald-400 font-medium">Goal Achieved!</span>
                  </div>
                )}

                {/* Notes */}
                {goal.notes && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-500">{goal.notes}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Target size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No goals yet</h3>
          <p className="text-slate-500 mb-4">Set your first financial goal to start tracking progress</p>
          <Button onClick={openAddModal} icon={Plus}>
            Add Goal
          </Button>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Edit Goal' : 'Add New Goal'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Goal Type *"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            {GOAL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>

          <Input
            label="Target Amount *"
            type="number"
            step="0.01"
            min="0"
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
            placeholder="Enter target amount"
            required
          />

          <Select
            label="Period *"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            required
          >
            {PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </Select>

          {formData.type === 'expense' && (
            <Select
              label="Category (Optional)"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
            >
              <option value="">All Categories</option>
              <option value="subscriptions">Subscriptions</option>
              <option value="fees">Fees</option>
              <option value="tools">Tools</option>
              <option value="salaries">Salaries</option>
              <option value="outsourcing">Outsourcing</option>
              <option value="advertising">Advertising</option>
              <option value="office_supplies">Office Supplies</option>
              <option value="travel">Travel</option>
              <option value="rent">Rent</option>
              <option value="utilities">Utilities</option>
              <option value="internet_phone">Internet/Phone</option>
              <option value="transportation">Transportation</option>
              <option value="other">Other</option>
            </Select>
          )}

          <Textarea
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any notes about this goal..."
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {editingGoal ? 'Update Goal' : 'Add Goal'}
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

