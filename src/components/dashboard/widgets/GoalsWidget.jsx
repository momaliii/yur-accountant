import { Link } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';
import { useDataStore, useSettingsStore } from '../../../stores/useStore';
import currencyService from '../../../services/currency/currencyService';
import WidgetContainer from '../WidgetContainer';

export default function GoalsWidget({ widget, isEditing, onRemove, onSettings }) {
  const { goals } = useDataStore();
  const { baseCurrency, exchangeRates } = useSettingsStore();

  const activeGoals = goals.filter((g) => {
    if (!g.targetAmount || !g.currentAmount) return false;
    return g.currentAmount < g.targetAmount;
  }).slice(0, 5);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgress = (goal) => {
    if (!goal.targetAmount || goal.targetAmount === 0) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  return (
    <WidgetContainer
      widget={widget}
      isEditing={isEditing}
      onRemove={onRemove}
      onSettings={onSettings}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Active Goals</h3>
          <Link
            to="/app/goals"
            className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
          >
            View All
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="space-y-4">
          {activeGoals.length === 0 ? (
            <p className="text-slate-400 text-sm">No active goals</p>
          ) : (
            activeGoals.map((goal) => {
              const progress = getProgress(goal);
              return (
                <div key={goal._id || goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-amber-400" />
                      <span className="text-sm font-medium text-white">{goal.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
