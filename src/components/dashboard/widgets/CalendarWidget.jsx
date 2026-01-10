import { useMemo } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { useDataStore, useSettingsStore } from '../../../stores/useStore';
import WidgetContainer from '../WidgetContainer';

export default function CalendarWidget({ widget, isEditing, onRemove, onSettings }) {
  const { invoices, debts } = useDataStore();
  const { baseCurrency } = useSettingsStore();

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const deadlines = [];

    // Add invoice due dates
    invoices
      .filter((inv) => inv.status !== 'paid' && inv.dueDate)
      .forEach((inv) => {
        const dueDate = new Date(inv.dueDate);
        if (dueDate >= now && dueDate <= next30Days) {
          deadlines.push({
            id: inv._id || inv.id,
            type: 'invoice',
            title: `Invoice #${inv.invoiceNumber || 'N/A'}`,
            date: dueDate,
            amount: inv.totalAmount || 0,
            currency: inv.currency || baseCurrency,
            status: inv.status,
          });
        }
      });

    // Add debt due dates
    debts
      .filter((debt) => debt.status !== 'paid' && debt.dueDate)
      .forEach((debt) => {
        const dueDate = new Date(debt.dueDate);
        if (dueDate >= now && dueDate <= next30Days) {
          deadlines.push({
            id: debt._id || debt.id,
            type: debt.type === 'owed_to_me' ? 'debt-owed' : 'debt-owe',
            title: debt.description || 'Debt',
            date: dueDate,
            amount: debt.amount || 0,
            currency: debt.currency || baseCurrency,
            status: debt.status,
          });
        }
      });

    // Sort by date
    return deadlines.sort((a, b) => a.date - b.date).slice(0, 5);
  }, [invoices, debts, baseCurrency]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysUntil = (date) => {
    const now = new Date();
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <WidgetContainer
      widget={widget}
      isEditing={isEditing}
      onRemove={onRemove}
      onSettings={onSettings}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Upcoming Deadlines</h3>
        </div>
        <div className="space-y-3">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-slate-400 text-sm">No upcoming deadlines</p>
          ) : (
            upcomingDeadlines.map((deadline) => {
              const daysUntil = getDaysUntil(deadline.date);
              const isOverdue = daysUntil < 0;
              const isUrgent = daysUntil <= 3 && daysUntil >= 0;

              return (
                <div
                  key={deadline.id}
                  className={`p-3 rounded-lg border ${
                    isOverdue
                      ? 'bg-red-500/10 border-red-500/30'
                      : isUrgent
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isOverdue && <AlertCircle size={14} className="text-red-400" />}
                        <span className="text-sm font-medium text-white truncate">
                          {deadline.title}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDate(deadline.date)}
                        {isOverdue && <span className="text-red-400 ml-2">Overdue</span>}
                        {isUrgent && !isOverdue && (
                          <span className="text-amber-400 ml-2">{daysUntil} days left</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {formatCurrency(deadline.amount, deadline.currency)}
                    </div>
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
