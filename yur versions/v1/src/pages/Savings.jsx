import { useState, useMemo } from 'react';
import {
  Plus,
  Landmark,
  Edit2,
  Trash2,
  Calendar,
  Search,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Coins,
  FileText,
  BarChart3,
  ArrowUp,
  ArrowDown,
  History,
  Eye,
  EyeOff,
  Sparkles,
  Lightbulb,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import currencyService from '../services/currency/currencyService';
import aiService from '../services/ai/aiService';
import priceService from '../services/price/priceService';

const SAVINGS_TYPES = [
  { value: 'gold', label: 'Gold', icon: Coins, color: 'amber' },
  { value: 'money', label: 'Money/Cash', icon: DollarSign, color: 'emerald' },
  { value: 'certificate', label: 'Certificate/Deposit', icon: FileText, color: 'blue' },
  { value: 'stock', label: 'Stock/Investment', icon: TrendingUp, color: 'purple' },
];

const TRANSACTION_TYPES = [
  { value: 'deposit', label: 'Deposit', icon: ArrowUp },
  { value: 'withdrawal', label: 'Withdrawal', icon: ArrowDown },
  { value: 'value_update', label: 'Value Update', icon: BarChart3 },
];

const initialSavingsFormState = {
  name: '',
  type: 'money',
  currency: 'EGP',
  initialAmount: '',
  currentAmount: '',
  targetAmount: '',
  targetDate: '',
  interestRate: '',
  maturityDate: '',
  startDate: '',
  quantity: '',
  pricePerUnit: '',
  notes: '',
};

const initialTransactionFormState = {
  type: 'deposit',
  amount: '',
  currency: 'EGP',
  date: new Date().toISOString().split('T')[0],
  quantity: '',
  pricePerUnit: '',
  notes: '',
};

export default function Savings() {
  const { savings, savingsTransactions, income, expenses, addSavings, updateSavings, deleteSavings, addSavingsTransaction, updateSavingsTransaction, deleteSavingsTransaction, updateSavingsValue } = useDataStore();
  const { baseCurrency, currencies, exchangeRates, privacyMode, setPrivacyMode, openaiApiKey } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingSavings, setEditingSavings] = useState(null);
  const [selectedSavingsForTransaction, setSelectedSavingsForTransaction] = useState(null);
  const [savingsFormData, setSavingsFormData] = useState(initialSavingsFormState);
  const [transactionFormData, setTransactionFormData] = useState(initialTransactionFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingTransactions, setViewingTransactions] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [showProjections, setShowProjections] = useState({});

  // Filter and sort savings
  const filteredSavings = useMemo(() => {
    let filtered = [...savings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(query) || s.notes?.toLowerCase().includes(query));
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter((s) => s.type === filterType);
    }

    // Currency filter
    if (filterCurrency) {
      filtered = filtered.filter((s) => s.currency === filterCurrency);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'value') {
        return (b.currentAmount || b.initialAmount || 0) - (a.currentAmount || a.initialAmount || 0);
      } else if (sortBy === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return filtered;
  }, [savings, searchQuery, filterType, filterCurrency, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = savings.reduce((sum, s) => {
      const amount = s.currentAmount || s.initialAmount || 0;
      return sum + currencyService.convert(amount, s.currency || baseCurrency, baseCurrency, exchangeRates);
    }, 0);

    const byType = SAVINGS_TYPES.reduce((acc, type) => {
      const typeSavings = savings.filter((s) => s.type === type.value);
      const total = typeSavings.reduce((sum, s) => {
        const amount = s.currentAmount || s.initialAmount || 0;
        return sum + currencyService.convert(amount, s.currency || baseCurrency, baseCurrency, exchangeRates);
      }, 0);
      acc[type.value] = total;
      return acc;
    }, {});

    const totalTarget = savings.reduce((sum, s) => {
      if (!s.targetAmount) return sum;
      return sum + currencyService.convert(s.targetAmount, s.currency || baseCurrency, baseCurrency, exchangeRates);
    }, 0);

    const upcomingMaturities = savings.filter((s) => {
      if (!s.maturityDate) return false;
      const maturity = new Date(s.maturityDate);
      const now = new Date();
      const daysUntil = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    }).length;

    return { total, byType, totalTarget, upcomingMaturities };
  }, [savings, baseCurrency, exchangeRates]);

  const openAddSavingsModal = () => {
    setEditingSavings(null);
    setSavingsFormData({
      ...initialSavingsFormState,
      currency: baseCurrency,
    });
    setIsSavingsModalOpen(true);
  };

  const openEditSavingsModal = (saving) => {
    setEditingSavings(saving);
    setSavingsFormData({
      name: saving.name || '',
      type: saving.type || 'money',
      currency: saving.currency || baseCurrency,
      initialAmount: saving.initialAmount?.toString() || '',
      currentAmount: saving.currentAmount?.toString() || '',
      targetAmount: saving.targetAmount?.toString() || '',
      targetDate: saving.targetDate || '',
      interestRate: saving.interestRate?.toString() || '',
      maturityDate: saving.maturityDate || '',
      startDate: saving.startDate || '',
      quantity: saving.quantity?.toString() || '',
      pricePerUnit: saving.pricePerUnit?.toString() || '',
      notes: saving.notes || '',
    });
    setIsSavingsModalOpen(true);
  };

  const openAddTransactionModal = (saving) => {
    setSelectedSavingsForTransaction(saving);
    setTransactionFormData({
      ...initialTransactionFormState,
      currency: saving.currency || baseCurrency,
      date: new Date().toISOString().split('T')[0],
    });
    setIsTransactionModalOpen(true);
  };

  const handleSavingsSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const savingsData = {
        name: savingsFormData.name,
        type: savingsFormData.type,
        currency: savingsFormData.currency,
        initialAmount: parseFloat(savingsFormData.initialAmount) || 0,
        currentAmount: parseFloat(savingsFormData.currentAmount) || parseFloat(savingsFormData.initialAmount) || 0,
        targetAmount: savingsFormData.targetAmount ? parseFloat(savingsFormData.targetAmount) : null,
        targetDate: savingsFormData.targetDate || null,
        interestRate: savingsFormData.interestRate ? parseFloat(savingsFormData.interestRate) : null,
        maturityDate: savingsFormData.maturityDate || null,
        startDate: (savingsFormData.type === 'certificate' || savingsFormData.type === 'money') && savingsFormData.startDate ? savingsFormData.startDate : null,
        quantity: (savingsFormData.type === 'gold' || savingsFormData.type === 'stock') && savingsFormData.quantity ? parseFloat(savingsFormData.quantity) : null,
        pricePerUnit: (savingsFormData.type === 'gold' || savingsFormData.type === 'stock') && savingsFormData.pricePerUnit ? parseFloat(savingsFormData.pricePerUnit) : null,
        notes: savingsFormData.notes || '',
      };

      if (editingSavings) {
        await updateSavings(editingSavings.id, savingsData);
      } else {
        await addSavings(savingsData);
      }

      setIsSavingsModalOpen(false);
      setSavingsFormData(initialSavingsFormState);
    } catch (error) {
      console.error('Failed to save savings:', error);
    }

    setIsSubmitting(false);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const transactionData = {
        savingsId: selectedSavingsForTransaction.id,
        type: transactionFormData.type,
        amount: parseFloat(transactionFormData.amount) || 0,
        currency: transactionFormData.currency,
        date: transactionFormData.date,
        quantity: (selectedSavingsForTransaction.type === 'gold' || selectedSavingsForTransaction.type === 'stock') && transactionFormData.quantity ? parseFloat(transactionFormData.quantity) : null,
        pricePerUnit: (selectedSavingsForTransaction.type === 'gold' || selectedSavingsForTransaction.type === 'stock') && transactionFormData.pricePerUnit ? parseFloat(transactionFormData.pricePerUnit) : null,
        notes: transactionFormData.notes || '',
      };

      await addSavingsTransaction(transactionData);

      setIsTransactionModalOpen(false);
      setTransactionFormData(initialTransactionFormState);
      setSelectedSavingsForTransaction(null);
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (saving) => {
    if (window.confirm(`Are you sure you want to delete "${saving.name}"? All related transactions will also be deleted.`)) {
      await deleteSavings(saving.id);
    }
  };

  const formatCurrency = (amount, currency) => currencyService.formatCurrency(amount, currency || baseCurrency);

  const getSavingsTypeInfo = (type) => SAVINGS_TYPES.find((t) => t.value === type) || SAVINGS_TYPES[1];

  const getTypeColorClasses = (color) => {
    const colorMap = {
      amber: 'from-amber-500 to-amber-600',
      emerald: 'from-emerald-500 to-emerald-600',
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
    };
    return colorMap[color] || 'from-indigo-500 to-indigo-600';
  };

  const getTypeBadgeClasses = (color) => {
    const colorMap = {
      amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return colorMap[color] || 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  };

  const getProgress = (saving) => {
    if (!saving.targetAmount || saving.targetAmount <= 0) return null;
    const current = saving.currentAmount || saving.initialAmount || 0;
    if (current < 0) return 0;
    const progress = (current / saving.targetAmount) * 100;
    return Math.min(Math.max(0, progress), 100); // Clamp between 0 and 100
  };

  const isMaturityUpcoming = (saving) => {
    if (!saving.maturityDate) return false;
    const maturity = new Date(saving.maturityDate);
    const now = new Date();
    const daysUntil = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  };

  const getTransactionsForSavings = (savingsId) => {
    return savingsTransactions.filter((t) => t.savingsId === savingsId).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Smart Calculations
  const calculateInterestEarned = (saving) => {
    if (!saving.interestRate || !saving.initialAmount) return 0;
    const current = saving.currentAmount || saving.initialAmount;
    const initial = saving.initialAmount;
    
    // For certificates with start date, calculate expected interest based on time and rate
    if ((saving.type === 'certificate' || saving.type === 'money') && saving.startDate && saving.interestRate) {
      const startDate = new Date(saving.startDate);
      const now = new Date();
      const daysElapsed = (now - startDate) / (1000 * 60 * 60 * 24);
      if (daysElapsed <= 0) return 0;
      
      const years = daysElapsed / 365;
      const rate = saving.interestRate / 100;
      // Simple interest: Principal * Rate * Time
      const expectedInterest = initial * rate * years;
      
      // Return the actual interest earned (current - initial), but if it's 0, show expected
      const actualInterest = current - initial;
      // If current equals initial but time has passed, show expected interest
      if (actualInterest === 0 && years > 0) {
        return expectedInterest;
      }
      return actualInterest;
    }
    
    // For other types or without start date, return the difference
    return current - initial;
  };

  const calculateProjectedValue = (saving, months = 12) => {
    if (!saving.interestRate || saving.interestRate <= 0) {
      return saving.currentAmount || saving.initialAmount || 0;
    }
    const rate = saving.interestRate / 100;
    const principal = saving.currentAmount || saving.initialAmount || 0;
    if (principal <= 0) return principal;
    
    // For certificates with start date, calculate from start date
    if (saving.type === 'certificate' && saving.startDate) {
      const startDate = new Date(saving.startDate);
      const now = new Date();
      const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      const totalMonths = monthsElapsed + months;
      if (totalMonths <= 0) return principal;
      const years = totalMonths / 12;
      // Simple interest: Principal * (1 + Rate * Time)
      const interest = principal * rate * years;
      const projected = principal + interest;
      return isFinite(projected) && !isNaN(projected) ? projected : principal;
    }
    
    // Simple interest calculation: Principal * (1 + Rate * Time)
    if (months <= 0) return principal;
    const years = months / 12;
    const interest = principal * rate * years;
    const projected = principal + interest;
    return isFinite(projected) && !isNaN(projected) ? projected : principal;
  };

  const calculateTimeToGoal = (saving) => {
    if (!saving.targetAmount || !saving.targetDate || saving.targetAmount <= 0) return null;
    const current = saving.currentAmount || saving.initialAmount || 0;
    const remaining = saving.targetAmount - current;
    if (remaining <= 0) return { months: 0, onTrack: true, requiredMonthly: 0 };
    
    const targetDate = new Date(saving.targetDate);
    const now = new Date();
    let monthsUntilTarget = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
    
    // Handle case where target date is in the past
    if (monthsUntilTarget <= 0) {
      return { months: 0, onTrack: false, requiredMonthly: remaining };
    }
    
    if (saving.interestRate && saving.interestRate > 0) {
      const monthlyRate = saving.interestRate / 100 / 12;
      if (monthlyRate <= 0 || !isFinite(monthlyRate)) {
        // Fallback to simple calculation if rate is invalid
        const requiredMonthly = remaining / monthsUntilTarget;
        return { months: monthsUntilTarget, requiredMonthly: Math.max(0, requiredMonthly), onTrack: true };
      }
      
      // Future Value of Annuity formula: FV = PMT * (((1 + r)^n - 1) / r)
      // Solving for PMT: PMT = FV / (((1 + r)^n - 1) / r)
      const futureValueFactor = (Math.pow(1 + monthlyRate, monthsUntilTarget) - 1) / monthlyRate;
      
      // Also account for current amount growing with interest
      const currentFutureValue = current * Math.pow(1 + monthlyRate, monthsUntilTarget);
      const remainingWithInterest = saving.targetAmount - currentFutureValue;
      
      if (remainingWithInterest <= 0 || !isFinite(remainingWithInterest)) {
        // Already on track with just interest
        return { months: monthsUntilTarget, requiredMonthly: 0, onTrack: true };
      }
      
      if (futureValueFactor <= 0 || !isFinite(futureValueFactor)) {
        // Fallback to simple calculation
        const requiredMonthly = remaining / monthsUntilTarget;
        return { months: monthsUntilTarget, requiredMonthly: Math.max(0, requiredMonthly), onTrack: true };
      }
      
      const requiredMonthly = remainingWithInterest / futureValueFactor;
      const result = Math.max(0, requiredMonthly);
      return { months: monthsUntilTarget, requiredMonthly: isFinite(result) && !isNaN(result) ? result : 0, onTrack: true };
    }
    
    // Without interest, simple division
    const requiredMonthly = remaining / monthsUntilTarget;
    return { months: monthsUntilTarget, requiredMonthly: Math.max(0, requiredMonthly), onTrack: true };
  };

  const calculateROI = (saving) => {
    const initial = saving.initialAmount || 0;
    const current = saving.currentAmount || initial;
    if (initial === 0 || initial < 0) return 0;
    
    // For gold/stocks, calculate ROI based on price per unit changes
    if ((saving.type === 'gold' || saving.type === 'stock') && saving.quantity && saving.pricePerUnit) {
      // Calculate initial price per unit from initial amount and quantity
      const initialPricePerUnit = saving.initialAmount && saving.quantity ? saving.initialAmount / saving.quantity : 0;
      const currentPricePerUnit = saving.pricePerUnit;
      
      if (initialPricePerUnit > 0 && currentPricePerUnit > 0) {
        const roi = ((currentPricePerUnit - initialPricePerUnit) / initialPricePerUnit) * 100;
        if (isFinite(roi) && !isNaN(roi)) return roi;
      }
    }
    
    // For certificates with interest rate and start date, calculate ROI based on time
    if ((saving.type === 'certificate' || saving.type === 'money') && saving.startDate && saving.interestRate) {
      const startDate = new Date(saving.startDate);
      const now = new Date();
      const daysElapsed = (now - startDate) / (1000 * 60 * 60 * 24);
      if (daysElapsed <= 0) return 0;
      
      const years = daysElapsed / 365;
      const rate = saving.interestRate / 100;
      // ROI based on interest rate and time
      const expectedROI = rate * years * 100;
      
      // If current equals initial, use expected ROI
      if (current === initial && years > 0) {
        return expectedROI;
      }
    }
    
    // Standard ROI calculation: ((current - initial) / initial) * 100
    const roi = ((current - initial) / initial) * 100;
    // Handle edge cases
    if (!isFinite(roi) || isNaN(roi)) return 0;
    return roi;
  };

  const calculateGrowthRate = (saving) => {
    // Use startDate for certificates, createdAt for others
    const startDate = saving.startDate || saving.createdAt;
    if (!startDate) return 0;
    
    const daysSince = (new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24);
    if (daysSince <= 0) return 0;
    
    const initial = saving.initialAmount || 0;
    if (initial === 0 || initial < 0) return 0;
    
    const current = saving.currentAmount || initial;
    const growth = current - initial;
    
    // For gold/stocks, calculate growth rate based on price per unit changes
    if ((saving.type === 'gold' || saving.type === 'stock') && saving.quantity && saving.pricePerUnit) {
      const initialPricePerUnit = saving.initialAmount && saving.quantity ? saving.initialAmount / saving.quantity : 0;
      const currentPricePerUnit = saving.pricePerUnit;
      
      if (initialPricePerUnit > 0 && currentPricePerUnit > 0) {
        const priceGrowth = currentPricePerUnit - initialPricePerUnit;
        // Annualized growth rate based on price change: (Price Growth / Initial Price) * (365 / Days) * 100
        const annualized = (priceGrowth / initialPricePerUnit) * (365 / daysSince) * 100;
        if (isFinite(annualized) && !isNaN(annualized)) return annualized;
      }
    }
    
    // For certificates with interest rate, if current equals initial, use interest rate as growth rate
    if ((saving.type === 'certificate' || saving.type === 'money') && saving.interestRate && growth === 0 && daysSince > 0) {
      // Return the interest rate as the annualized growth rate
      return saving.interestRate;
    }
    
    // Annualized growth rate: (Growth / Initial) * (365 / Days) * 100
    const annualized = (growth / initial) * (365 / daysSince) * 100;
    // Handle edge cases
    if (!isFinite(annualized) || isNaN(annualized)) return 0;
    return annualized;
  };

  // Smart Alerts
  const getSavingsAlerts = useMemo(() => {
    const alerts = [];
    const now = new Date();

    savings.forEach((saving) => {
      // Maturity alerts
      if (saving.maturityDate) {
        const maturity = new Date(saving.maturityDate);
        const daysUntil = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0 && daysUntil <= 7) {
          alerts.push({
            type: 'maturity',
            severity: daysUntil <= 3 ? 'high' : 'medium',
            message: `${saving.name} matures in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
            saving,
          });
        }
      }

      // Goal progress alerts
      if (saving.targetAmount) {
        const current = saving.currentAmount || saving.initialAmount || 0;
        const progress = Math.min((current / saving.targetAmount) * 100, 100);
        if (progress >= 75 && progress < 100) {
          alerts.push({
            type: 'goal',
            severity: 'low',
            message: `You're ${progress.toFixed(0)}% towards your goal for ${saving.name}`,
            saving,
          });
        } else if (progress >= 100) {
          alerts.push({
            type: 'goal',
            severity: 'success',
            message: `Congratulations! You've reached your goal for ${saving.name}`,
            saving,
          });
        }

        // Behind schedule alert
        if (saving.targetDate) {
          const timeToGoal = calculateTimeToGoal(saving);
          if (timeToGoal && timeToGoal.requiredMonthly > 0) {
            // Check if required monthly is significantly higher than what would be needed if on track
            const targetDate = new Date(saving.targetDate);
            const monthsUntil = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
            if (monthsUntil > 0) {
              const remaining = saving.targetAmount - current;
              const averageMonthlyNeeded = remaining / monthsUntil;
              // Alert if required monthly is 20% more than average needed
              if (timeToGoal.requiredMonthly > averageMonthlyNeeded * 1.2) {
                alerts.push({
                  type: 'warning',
                  severity: 'medium',
                  message: `${saving.name} is behind schedule. Consider increasing contributions.`,
                  saving,
                });
              }
            }
          }
        }
      }
    });

    return alerts;
  }, [savings]);

  // Income/Expenses Integration
  const savingsSuggestions = useMemo(() => {
    const suggestions = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate monthly income
    const monthlyIncome = income
      .filter((i) => {
        const date = new Date(i.receivedDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, i) => {
        const amount = i.netAmount || i.amount;
        return sum + currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
      }, 0);

    // Calculate monthly expenses
    const monthlyExpenses = expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => {
        return sum + currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
      }, 0);

    const disposableIncome = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (stats.total / monthlyIncome) * 100 : 0;

    // Suggest increasing savings if disposable income is high
    if (disposableIncome > 0 && disposableIncome > monthlyIncome * 0.2) {
      const suggestedAmount = disposableIncome * 0.3;
      suggestions.push({
        type: 'increase',
        message: `You have ${formatCurrency(disposableIncome, baseCurrency)} disposable income. Consider saving ${formatCurrency(suggestedAmount, baseCurrency)} this month.`,
        amount: suggestedAmount,
      });
    }

    // Suggest savings rate improvement
    if (savingsRate < 20 && monthlyIncome > 0) {
      const recommendedSavings = monthlyIncome * 0.2;
      suggestions.push({
        type: 'rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of income (${formatCurrency(recommendedSavings, baseCurrency)}/month).`,
        amount: recommendedSavings,
      });
    }

    return suggestions;
  }, [income, expenses, stats.total, baseCurrency, exchangeRates]);

  // Load AI Insights
  const loadSavingsInsights = async () => {
    if (!openaiApiKey || savings.length === 0) return;
    
    setIsLoadingInsights(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyIncome = income
        .filter((i) => {
          const date = new Date(i.receivedDate);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, i) => {
          const amount = i.netAmount || i.amount;
          return sum + currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
        }, 0);

      const monthlyExpenses = expenses
        .filter((e) => {
          const date = new Date(e.date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, e) => {
          return sum + currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
        }, 0);

      const savingsRate = monthlyIncome > 0 ? (stats.total / monthlyIncome) * 100 : 0;

      const insights = await aiService.getSavingsInsights(
        {
          savings,
          total: stats.total,
          totalTarget: stats.totalTarget,
          currency: baseCurrency,
          savingsRate,
        },
        { monthlyIncome },
        { monthlyExpenses },
        openaiApiKey
      );
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to load savings insights:', error);
    }
    setIsLoadingInsights(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">My Savings</h1>
          <p className="text-slate-400 mt-1">Track and plan your savings across different types</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPrivacyMode(!privacyMode)} variant="secondary" icon={privacyMode ? EyeOff : Eye}>
            {privacyMode ? 'Show' : 'Hide'}
          </Button>
          <Button onClick={openAddSavingsModal} icon={Plus}>
            Add Savings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Landmark size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Savings</p>
              <PrivacyValue value={formatCurrency(stats.total, baseCurrency)} />
            </div>
          </div>
        </Card>
        {SAVINGS_TYPES.map((type) => (
          <Card key={type.value}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeColorClasses(type.color)} flex items-center justify-center`}>
                <type.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{type.label}</p>
                <PrivacyValue value={formatCurrency(stats.byType[type.value] || 0, baseCurrency)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {stats.totalTarget > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Total Target Progress</p>
            <span className="text-sm font-medium text-white">
              {formatCurrency(stats.total, baseCurrency)} / {formatCurrency(stats.totalTarget, baseCurrency)}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((stats.total / stats.totalTarget) * 100, 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* Smart Alerts */}
      {getSavingsAlerts.length > 0 && (
        <Card className="border-2 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Smart Alerts</h3>
              <div className="space-y-2">
                {getSavingsAlerts.map((alert, idx) => (
                  <div key={idx} className="text-sm text-slate-300">
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Smart Recommendations */}
      {savingsSuggestions.length > 0 && (
        <Card className="border-2 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Smart Recommendations</h3>
              <div className="space-y-2">
                {savingsSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="text-sm text-slate-300">
                    {suggestion.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* AI Insights Panel */}
      {openaiApiKey && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-400" />
              <h3 className="font-semibold text-white">AI Savings Insights</h3>
            </div>
            <Button
              onClick={loadSavingsInsights}
              variant="secondary"
              size="sm"
              loading={isLoadingInsights}
              disabled={savings.length === 0}
            >
              {aiInsights ? 'Refresh Insights' : 'Get Insights'}
            </Button>
          </div>
          {aiInsights ? (
            <div className="prose prose-invert max-w-none">
              <div className="text-sm text-slate-300 whitespace-pre-wrap">{aiInsights}</div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Get AI-powered insights and recommendations about your savings strategy.
            </p>
          )}
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search savings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {SAVINGS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
          <Select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)}>
            <option value="">All Currencies</option>
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-slate-400">Sort by:</span>
          <div className="flex gap-2">
            {['name', 'value', 'createdAt'].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === sort
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {sort === 'name' ? 'Name' : sort === 'value' ? 'Value' : 'Newest'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Savings List */}
      <div className="space-y-3">
        {filteredSavings.length > 0 ? (
          filteredSavings.map((saving) => {
            const typeInfo = getSavingsTypeInfo(saving.type);
            const progress = getProgress(saving);
            const maturityUpcoming = isMaturityUpcoming(saving);
            const currentValue = saving.currentAmount || saving.initialAmount || 0;

            return (
              <Card key={saving.id} className={maturityUpcoming ? 'border border-amber-500/50 bg-amber-500/5' : ''}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeColorClasses(typeInfo.color)} flex items-center justify-center`}>
                        <typeInfo.icon size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-white">{saving.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${getTypeBadgeClasses(typeInfo.color)}`}>
                            {typeInfo.label}
                          </span>
                          {saving.interestRate && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              {saving.interestRate}% interest
                            </span>
                          )}
                          {maturityUpcoming && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <AlertCircle size={12} />
                              Maturity Soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-14 space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Current Value: </span>
                          <span className="font-semibold text-white">
                            <PrivacyValue value={formatCurrency(currentValue, saving.currency)} />
                          </span>
                        </div>
                        {(saving.type === 'gold' || saving.type === 'stock') && saving.quantity && saving.pricePerUnit && (
                          <div>
                            <span className="text-slate-400">
                              {saving.type === 'gold' ? 'Quantity: ' : 'Shares: '}
                            </span>
                            <span className="text-white">{saving.quantity}</span>
                            <span className="text-slate-400 ml-2">@ </span>
                            <span className="text-white">
                              <PrivacyValue value={formatCurrency(saving.pricePerUnit, saving.currency)} />
                            </span>
                          </div>
                        )}
                      </div>

                      {saving.targetAmount && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-400">Target: {formatCurrency(saving.targetAmount, saving.currency)}</span>
                            <span className="text-sm font-medium text-white">{progress?.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${getTypeColorClasses(typeInfo.color)} h-2 rounded-full transition-all`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Smart Calculations */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/10">
                        {saving.interestRate && (
                          <div>
                            <p className="text-xs text-slate-500">Interest Earned</p>
                            <p className="text-sm font-medium text-emerald-400">
                              <PrivacyValue value={formatCurrency(calculateInterestEarned(saving), saving.currency)} />
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-slate-500">ROI</p>
                          <p className={`text-sm font-medium ${calculateROI(saving) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {calculateROI(saving).toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Growth Rate</p>
                          <p className={`text-sm font-medium ${calculateGrowthRate(saving) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {calculateGrowthRate(saving).toFixed(2)}% p.a.
                          </p>
                        </div>
                        {saving.targetAmount && calculateTimeToGoal(saving) && (
                          <div>
                            <p className="text-xs text-slate-500">Time to Goal</p>
                            <p className="text-sm font-medium text-white">
                              {calculateTimeToGoal(saving).months} months
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Projections */}
                      {saving.interestRate && (
                        <div className="pt-2 border-t border-white/10">
                          <button
                            onClick={() => setShowProjections({ ...showProjections, [saving.id]: !showProjections[saving.id] })}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                          >
                            <TrendingUpIcon size={14} />
                            {showProjections[saving.id] ? 'Hide' : 'Show'} Projections
                          </button>
                          {showProjections[saving.id] && (
                            <div className="mt-2 space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">6 months:</span>
                                <span className="text-white font-medium">
                                  <PrivacyValue value={formatCurrency(calculateProjectedValue(saving, 6), saving.currency)} />
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">12 months:</span>
                                <span className="text-white font-medium">
                                  <PrivacyValue value={formatCurrency(calculateProjectedValue(saving, 12), saving.currency)} />
                                </span>
                              </div>
                              {calculateTimeToGoal(saving) && calculateTimeToGoal(saving).requiredMonthly && (
                                <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <p className="text-xs text-blue-400 mb-1">Required Monthly Contribution:</p>
                                  <p className="text-sm font-medium text-white">
                                    <PrivacyValue value={formatCurrency(calculateTimeToGoal(saving).requiredMonthly, saving.currency)} />
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        {saving.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            Start: {new Date(saving.startDate).toLocaleDateString()}
                          </div>
                        )}
                        {saving.maturityDate && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            Maturity: {new Date(saving.maturityDate).toLocaleDateString()}
                          </div>
                        )}
                        {saving.targetDate && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            Target: {new Date(saving.targetDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {saving.notes && (
                        <p className="text-sm text-slate-400 mt-2">{saving.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setViewingTransactions(viewingTransactions === saving.id ? null : saving.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      aria-label="View transactions"
                    >
                      <History size={18} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => openAddTransactionModal(saving)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      aria-label="Add transaction"
                    >
                      <Plus size={18} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => openEditSavingsModal(saving)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      aria-label="Edit"
                    >
                      <Edit2 size={18} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(saving)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Transactions List */}
                {viewingTransactions === saving.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Transaction History</h4>
                    {getTransactionsForSavings(saving.id).length > 0 ? (
                      <div className="space-y-2">
                        {getTransactionsForSavings(saving.id).map((transaction) => {
                          const transactionType = TRANSACTION_TYPES.find((t) => t.value === transaction.type);
                          return (
                            <div key={transaction.id} className="p-2 rounded-lg bg-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <transactionType.icon size={16} className={`text-${transaction.type === 'deposit' ? 'emerald' : transaction.type === 'withdrawal' ? 'red' : 'blue'}-400`} />
                                <span className="text-sm text-slate-300">{transactionType.label}</span>
                                <span className="text-sm text-slate-400">
                                  {formatCurrency(transaction.amount, transaction.currency)}
                                </span>
                                {transaction.quantity && transaction.pricePerUnit && (
                                  <span className="text-xs text-slate-500">
                                    ({transaction.quantity} @ {formatCurrency(transaction.pricePerUnit, transaction.currency)})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(transaction.date).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No transactions yet</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <Card className="text-center py-12">
            <Landmark size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">No savings found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery || filterType || filterCurrency
                ? 'Try adjusting your filters'
                : 'Start tracking your savings by adding your first entry'}
            </p>
            {!searchQuery && !filterType && !filterCurrency && (
              <Button onClick={openAddSavingsModal} icon={Plus}>
                Add Savings
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Add/Edit Savings Modal */}
      <Modal
        isOpen={isSavingsModalOpen}
        onClose={() => {
          setIsSavingsModalOpen(false);
          setSavingsFormData(initialSavingsFormState);
        }}
        title={editingSavings ? 'Edit Savings' : 'Add New Savings'}
        size="lg"
      >
        <form onSubmit={handleSavingsSubmit} className="space-y-4">
          <Input
            label="Name *"
            value={savingsFormData.name}
            onChange={(e) => setSavingsFormData({ ...savingsFormData, name: e.target.value })}
            placeholder="e.g., Gold Savings, Bank Certificate"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Type *"
              value={savingsFormData.type}
              onChange={(e) => setSavingsFormData({ ...savingsFormData, type: e.target.value })}
            >
              {SAVINGS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>

            <Select
              label="Currency *"
              value={savingsFormData.currency}
              onChange={(e) => setSavingsFormData({ ...savingsFormData, currency: e.target.value })}
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Initial Amount *"
              type="number"
              step="0.01"
              min="0"
              value={savingsFormData.initialAmount}
              onChange={(e) => setSavingsFormData({ ...savingsFormData, initialAmount: e.target.value })}
              placeholder="0.00"
              required
            />

            <Input
              label="Current Amount"
              type="number"
              step="0.01"
              min="0"
              value={savingsFormData.currentAmount}
              onChange={(e) => setSavingsFormData({ ...savingsFormData, currentAmount: e.target.value })}
              placeholder="Auto-filled from initial"
            />
          </div>

          {(savingsFormData.type === 'gold' || savingsFormData.type === 'stock') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={savingsFormData.type === 'gold' ? 'Quantity (grams/ounces)' : 'Quantity (shares)'}
                type="number"
                step="0.01"
                min="0"
                value={savingsFormData.quantity}
                onChange={(e) => setSavingsFormData({ ...savingsFormData, quantity: e.target.value })}
                placeholder="0.00"
              />

              <Input
                label="Price per Unit"
                type="number"
                step="0.01"
                min="0"
                value={savingsFormData.pricePerUnit}
                onChange={(e) => setSavingsFormData({ ...savingsFormData, pricePerUnit: e.target.value })}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target Amount (optional)"
              type="number"
              step="0.01"
              min="0"
              value={savingsFormData.targetAmount}
              onChange={(e) => setSavingsFormData({ ...savingsFormData, targetAmount: e.target.value })}
              placeholder="0.00"
            />

            <Input
              label="Target Date (optional)"
              type="date"
              value={savingsFormData.targetDate}
              onChange={(e) => setSavingsFormData({ ...savingsFormData, targetDate: e.target.value })}
            />
          </div>

          {(savingsFormData.type === 'money' || savingsFormData.type === 'certificate') && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Interest Rate % (optional)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={savingsFormData.interestRate}
                  onChange={(e) => setSavingsFormData({ ...savingsFormData, interestRate: e.target.value })}
                  placeholder="0.00"
                />
                {savingsFormData.type === 'certificate' && (
                  <Input
                    label="Start Date (Purchase Date)"
                    type="date"
                    value={savingsFormData.startDate}
                    onChange={(e) => setSavingsFormData({ ...savingsFormData, startDate: e.target.value })}
                  />
                )}
              </div>
              {savingsFormData.type === 'certificate' && (
                <Input
                  label="Maturity Date (optional)"
                  type="date"
                  value={savingsFormData.maturityDate}
                  onChange={(e) => setSavingsFormData({ ...savingsFormData, maturityDate: e.target.value })}
                />
              )}
            </>
          )}

          <Textarea
            label="Notes"
            value={savingsFormData.notes}
            onChange={(e) => setSavingsFormData({ ...savingsFormData, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsSavingsModalOpen(false);
                setSavingsFormData(initialSavingsFormState);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingSavings ? 'Update Savings' : 'Create Savings'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setTransactionFormData(initialTransactionFormState);
          setSelectedSavingsForTransaction(null);
        }}
        title={selectedSavingsForTransaction ? `Add Transaction - ${selectedSavingsForTransaction.name}` : 'Add Transaction'}
        size="md"
      >
        <form onSubmit={handleTransactionSubmit} className="space-y-4">
          <Select
            label="Transaction Type *"
            value={transactionFormData.type}
            onChange={(e) => setTransactionFormData({ ...transactionFormData, type: e.target.value })}
          >
            {TRANSACTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>

          {(selectedSavingsForTransaction?.type === 'gold' || selectedSavingsForTransaction?.type === 'stock') && transactionFormData.type === 'value_update' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={selectedSavingsForTransaction.type === 'gold' ? 'Quantity (grams/ounces)' : 'Quantity (shares)'}
                type="number"
                step="0.01"
                min="0"
                value={transactionFormData.quantity}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, quantity: e.target.value })}
                placeholder="0.00"
              />

              <Input
                label="Price per Unit *"
                type="number"
                step="0.01"
                min="0"
                value={transactionFormData.pricePerUnit}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, pricePerUnit: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          )}

          {transactionFormData.type !== 'value_update' && (
            <Input
              label="Amount *"
              type="number"
              step="0.01"
              min="0"
              value={transactionFormData.amount}
              onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Currency *"
              value={transactionFormData.currency}
              onChange={(e) => setTransactionFormData({ ...transactionFormData, currency: e.target.value })}
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </Select>

            <Input
              label="Date *"
              type="date"
              value={transactionFormData.date}
              onChange={(e) => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
              required
            />
          </div>

          <Textarea
            label="Notes"
            value={transactionFormData.notes}
            onChange={(e) => setTransactionFormData({ ...transactionFormData, notes: e.target.value })}
            placeholder="Transaction notes..."
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsTransactionModalOpen(false);
                setTransactionFormData(initialTransactionFormState);
                setSelectedSavingsForTransaction(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Add Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

