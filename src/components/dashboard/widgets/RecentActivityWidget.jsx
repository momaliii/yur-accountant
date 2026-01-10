import { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useDataStore, useSettingsStore } from '../../../stores/useStore';
import currencyService from '../../../services/currency/currencyService';
import WidgetContainer from '../WidgetContainer';

export default function RecentActivityWidget({ widget, isEditing, onRemove, onSettings }) {
  const { income, expenses } = useDataStore();
  const { baseCurrency, exchangeRates } = useSettingsStore();
  const limit = widget.settings?.limit || 10;

  const recentActivity = useMemo(() => {
    const activities = [];

    // Add income entries
    income.slice(0, limit).forEach((inc) => {
      activities.push({
        id: inc._id || inc.id,
        type: 'income',
        amount: currencyService.convert(
          inc.netAmount || inc.amount || 0,
          inc.currency || baseCurrency,
          baseCurrency,
          exchangeRates
        ),
        date: inc.receivedDate,
        description: inc.source || 'Income',
      });
    });

    // Add expense entries
    expenses.slice(0, limit).forEach((exp) => {
      activities.push({
        id: exp._id || exp.id,
        type: 'expense',
        amount: currencyService.convert(
          exp.amount || 0,
          exp.currency || baseCurrency,
          baseCurrency,
          exchangeRates
        ),
        date: exp.date,
        description: exp.category || exp.description || 'Expense',
      });
    });

    // Sort by date (newest first) and limit
    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }, [income, expenses, baseCurrency, exchangeRates, limit]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <WidgetContainer
      widget={widget}
      isEditing={isEditing}
      onRemove={onRemove}
      onSettings={onSettings}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-slate-400 text-sm">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === 'income'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {activity.type === 'income' ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {activity.description}
                    </div>
                    <div className="text-xs text-slate-400">{formatDate(activity.date)}</div>
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    activity.type === 'income' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {activity.type === 'income' ? '+' : '-'}
                  {formatCurrency(activity.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
