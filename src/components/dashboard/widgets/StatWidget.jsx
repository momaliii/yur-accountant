import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Receipt } from 'lucide-react';
import { useDataStore, useSettingsStore } from '../../../stores/useStore';
import currencyService from '../../../services/currency/currencyService';
import WidgetContainer from '../WidgetContainer';

const statIcons = {
  income: TrendingUp,
  expenses: TrendingDown,
  clients: Users,
  goals: Target,
  profit: DollarSign,
  invoices: Receipt,
};

const statColors = {
  income: 'text-green-400',
  expenses: 'text-red-400',
  clients: 'text-indigo-400',
  goals: 'text-amber-400',
  profit: 'text-cyan-400',
  invoices: 'text-purple-400',
};

export default function StatWidget({ widget, isEditing, onRemove, onSettings }) {
  const { clients, income, expenses, goals } = useDataStore();
  const { baseCurrency, exchangeRates } = useSettingsStore();

  const statData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const statType = widget.settings?.statType || 'income';

    switch (statType) {
      case 'income': {
        const monthlyIncome = income.filter((i) => {
          const date = new Date(i.receivedDate);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        const total = monthlyIncome.reduce((sum, i) => {
          const amount = i.netAmount || i.amount || 0;
          return sum + currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
        }, 0);
        return {
          value: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: baseCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(total),
          label: 'This Month Income',
        };
      }
      case 'expenses': {
        const monthlyExpenses = expenses.filter((e) => {
          const date = new Date(e.date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        const total = monthlyExpenses.reduce((sum, e) => {
          return sum + currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
        }, 0);
        return {
          value: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: baseCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(total),
          label: 'This Month Expenses',
        };
      }
      case 'clients': {
        const activeClients = clients.filter((c) => (c.status || 'active') === 'active').length;
        return {
          value: activeClients.toString(),
          label: 'Total Clients',
        };
      }
      case 'goals': {
        const activeGoals = goals.filter((g) => {
          if (!g.targetAmount || !g.currentAmount) return false;
          return g.currentAmount < g.targetAmount;
        }).length;
        return {
          value: activeGoals.toString(),
          label: 'Active Goals',
        };
      }
      default:
        return { value: '0', label: 'Stat' };
    }
  }, [widget.settings, clients, income, expenses, goals, baseCurrency, exchangeRates]);

  const Icon = statIcons[widget.settings?.statType || 'income'] || DollarSign;
  const colorClass = statColors[widget.settings?.statType || 'income'] || 'text-indigo-400';

  return (
    <WidgetContainer
      widget={widget}
      isEditing={isEditing}
      onRemove={onRemove}
      onSettings={onSettings}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <div className="text-2xl font-bold text-white mb-1">{statData.value}</div>
        <div className="text-sm text-slate-400">{statData.label}</div>
      </div>
    </WidgetContainer>
  );
}
