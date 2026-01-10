import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDataStore, useSettingsStore } from '../../../stores/useStore';
import currencyService from '../../../services/currency/currencyService';
import WidgetContainer from '../WidgetContainer';

export default function ChartWidget({ widget, isEditing, onRemove, onSettings }) {
  const { income, expenses } = useDataStore();
  const { baseCurrency, exchangeRates } = useSettingsStore();

  const chartType = widget.settings?.chartType || 'line';
  const period = widget.settings?.period || 'month';

  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];

    if (period === 'month') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const monthIncome = income
          .filter((inc) => {
            const incDate = new Date(inc.receivedDate);
            return incDate.getMonth() === date.getMonth() && incDate.getFullYear() === date.getFullYear();
          })
          .reduce((sum, inc) => {
            const amount = inc.netAmount || inc.amount || 0;
            return sum + currencyService.convert(amount, inc.currency || baseCurrency, baseCurrency, exchangeRates);
          }, 0);

        const monthExpenses = expenses
          .filter((exp) => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear();
          })
          .reduce((sum, exp) => {
            return sum + currencyService.convert(exp.amount, exp.currency || baseCurrency, baseCurrency, exchangeRates);
          }, 0);

        data.push({
          month: monthStr,
          income: monthIncome,
          expenses: monthExpenses,
          profit: monthIncome - monthExpenses,
        });
      }
    }

    return data;
  }, [income, expenses, baseCurrency, exchangeRates, period]);

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 5, left: 0, bottom: 0 },
    };

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
          />
          <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      );
    }

    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
          />
          <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
        </AreaChart>
      );
    }

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
          />
          <Bar dataKey="income" fill="#10b981" />
          <Bar dataKey="expenses" fill="#ef4444" />
        </BarChart>
      );
    }

    return null;
  };

  return (
    <WidgetContainer
      widget={widget}
      isEditing={isEditing}
      onRemove={onRemove}
      onSettings={onSettings}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={200}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </WidgetContainer>
  );
}
