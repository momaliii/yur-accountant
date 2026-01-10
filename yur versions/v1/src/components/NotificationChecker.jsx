import { useEffect, useRef } from 'react';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import notificationService from '../services/notifications/notificationService';
import currencyService from '../services/currency/currencyService';

export default function NotificationChecker() {
  const { debts, expenses, goals, income, savings } = useDataStore();
  const { notificationsEnabled, notificationPermission, baseCurrency, exchangeRates } = useSettingsStore();
  const lastCheckRef = useRef(null);
  const notifiedDebtsRef = useRef(new Set());
  const notifiedExpensesRef = useRef(new Set());
  const notifiedGoalsRef = useRef(new Set());
  const notifiedSavingsRef = useRef(new Set());

  useEffect(() => {
    if (!notificationsEnabled || notificationPermission !== 'granted') {
      return;
    }

    const checkNotifications = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Check overdue debts
      debts.forEach((debt) => {
        if (debt.status === 'paid') return;
        if (!debt.dueDate) return;

        const dueDate = new Date(debt.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const daysOverdue = Math.floor((today - dueDateOnly) / (1000 * 60 * 60 * 24));

        if (daysOverdue > 0 && !notifiedDebtsRef.current.has(debt.id)) {
          notificationService.notifyOverdueDebt(debt);
          notifiedDebtsRef.current.add(debt.id);
        } else if (daysOverdue === -1 && !notifiedDebtsRef.current.has(`upcoming-${debt.id}`)) {
          // Notify 1 day before due
          notificationService.notifyUpcomingDebt(debt, 1);
          notifiedDebtsRef.current.add(`upcoming-${debt.id}`);
        }
      });

      // Check recurring expenses (notify on the day they're due)
      expenses.forEach((expense) => {
        if (!expense.isRecurring) return;
        if (notifiedExpensesRef.current.has(expense.id)) return;

        const expenseDate = new Date(expense.date);
        const expenseDateOnly = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());
        
        // Check if it's the same day of month (for monthly recurring)
        if (expenseDateOnly.getDate() === today.getDate()) {
          notificationService.notifyRecurringExpense(expense);
          notifiedExpensesRef.current.add(expense.id);
        }
      });

      // Check goal progress (only notify once per goal when thresholds are reached)
      goals.forEach((goal) => {
        if (notifiedGoalsRef.current.has(goal.id)) return;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3) + 1;

        let periodStart, periodEnd;

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
          const year = goal.periodValue?.year || currentYear;
          periodStart = new Date(year, 0, 1);
          periodEnd = new Date(year, 11, 31, 23, 59, 59);
        }

        let currentAmount = 0;

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
          const periodExpenses = expenses.filter((e) => {
            const date = new Date(e.date);
            return date >= periodStart && date <= periodEnd;
          });
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

        const progress = (currentAmount / goal.targetAmount) * 100;

        if (progress >= 100 && !notifiedGoalsRef.current.has(`${goal.id}-achieved`)) {
          notificationService.notifyGoalProgress(goal, progress);
          notifiedGoalsRef.current.add(`${goal.id}-achieved`);
        } else if (progress >= 75 && !notifiedGoalsRef.current.has(`${goal.id}-75`)) {
          notificationService.notifyGoalProgress(goal, progress);
          notifiedGoalsRef.current.add(`${goal.id}-75`);
        }
      });

      // Check savings maturity and goals
      savings.forEach((saving) => {
        // Maturity alerts
        if (saving.maturityDate) {
          const maturity = new Date(saving.maturityDate);
          const daysUntil = Math.ceil((maturity - today) / (1000 * 60 * 60 * 24));
          if (daysUntil > 0 && daysUntil <= 7 && !notifiedSavingsRef.current.has(`maturity-${saving.id}`)) {
            notificationService.notifySavingsMaturity(saving, daysUntil);
            notifiedSavingsRef.current.add(`maturity-${saving.id}`);
          }
        }

        // Goal progress alerts
        if (saving.targetAmount) {
          const current = saving.currentAmount || saving.initialAmount || 0;
          const progress = (current / saving.targetAmount) * 100;
          
          if (progress >= 100 && !notifiedSavingsRef.current.has(`goal-${saving.id}-achieved`)) {
            notificationService.notifySavingsGoalProgress(saving, progress);
            notifiedSavingsRef.current.add(`goal-${saving.id}-achieved`);
          } else if (progress >= 75 && !notifiedSavingsRef.current.has(`goal-${saving.id}-75`)) {
            notificationService.notifySavingsGoalProgress(saving, progress);
            notifiedSavingsRef.current.add(`goal-${saving.id}-75`);
          }

          // Behind schedule alert
          if (saving.targetDate) {
            const targetDate = new Date(saving.targetDate);
            const monthsUntil = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
            const remaining = saving.targetAmount - current;
            const requiredMonthly = monthsUntil > 0 ? remaining / monthsUntil : 0;
            const currentMonthly = current / (monthsUntil > 0 ? monthsUntil : 1);
            
            if (monthsUntil > 0 && requiredMonthly > currentMonthly * 1.2 && !notifiedSavingsRef.current.has(`schedule-${saving.id}`)) {
              notificationService.notifySavingsBehindSchedule(saving);
              notifiedSavingsRef.current.add(`schedule-${saving.id}`);
            }
          }
        }
      });
    };

    // Check immediately
    checkNotifications();

    // Check every 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);

    // Reset notification flags daily at midnight
    const resetDaily = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow - now;

      setTimeout(() => {
        notifiedDebtsRef.current.clear();
        notifiedExpensesRef.current.clear();
        notifiedSavingsRef.current.clear();
        // Keep goal notifications for the period
        checkNotifications();
        resetDaily();
      }, msUntilMidnight);
    };
    resetDaily();

    return () => {
      clearInterval(interval);
    };
  }, [debts, expenses, goals, income, savings, notificationsEnabled, notificationPermission, baseCurrency, exchangeRates]);

  return null; // This component doesn't render anything
}

