import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, Receipt, Target, FileText, ArrowRight } from 'lucide-react';
import WidgetContainer from '../WidgetContainer';

const quickActions = [
  { icon: Users, label: 'Clients', path: '/app/clients', color: 'indigo' },
  { icon: TrendingUp, label: 'Income', path: '/app/income', color: 'green' },
  { icon: TrendingDown, label: 'Expenses', path: '/app/expenses', color: 'red' },
  { icon: Receipt, label: 'Invoices', path: '/app/invoices', color: 'cyan' },
  { icon: Target, label: 'Goals', path: '/app/goals', color: 'amber' },
  { icon: FileText, label: 'Reports', path: '/app/reports', color: 'purple' },
];

const colorClasses = {
  indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-400',
  green: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
  red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
  cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400',
  amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400',
  purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
};

export default function QuickActionsWidget({ widget, isEditing, onRemove, onSettings }) {
  return (
    <WidgetContainer
      widget={widget}
      isEditing={isEditing}
      onRemove={onRemove}
      onSettings={onSettings}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className={`group relative p-4 rounded-xl bg-gradient-to-br ${colorClasses[action.color]} border transition-all hover:scale-105`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <div className="font-medium text-sm">{action.label}</div>
                <ArrowRight
                  size={14}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </WidgetContainer>
  );
}
