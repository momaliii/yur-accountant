import { Link } from 'react-router-dom';
import { Users, ArrowRight, DollarSign } from 'lucide-react';
import { useDataStore, useSettingsStore } from '../../../stores/useStore';
import currencyService from '../../../services/currency/currencyService';
import WidgetContainer from '../WidgetContainer';

export default function ClientsWidget({ widget, isEditing, onRemove, onSettings }) {
  const { clients, income } = useDataStore();
  const { baseCurrency, exchangeRates } = useSettingsStore();
  const limit = widget.settings?.limit || 5;

  const topClients = clients
    .filter((c) => (c.status || 'active') === 'active')
    .map((client) => {
      // Calculate total income from this client
      const clientIncome = income
        .filter((inc) => inc.clientId === (client._id || client.id))
        .reduce((sum, inc) => {
          const amount = inc.netAmount || inc.amount || 0;
          return sum + currencyService.convert(
            amount,
            inc.currency || baseCurrency,
            baseCurrency,
            exchangeRates
          );
        }, 0);

      return {
        ...client,
        totalIncome: clientIncome,
      };
    })
    .sort((a, b) => b.totalIncome - a.totalIncome)
    .slice(0, limit);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
          <h3 className="text-lg font-semibold text-white">Top Clients</h3>
          <Link
            to="/app/clients"
            className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
          >
            View All
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="space-y-3">
          {topClients.length === 0 ? (
            <p className="text-slate-400 text-sm">No clients found</p>
          ) : (
            topClients.map((client) => (
              <div
                key={client._id || client.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Users size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {client.name}
                    </div>
                    {client.email && (
                      <div className="text-xs text-slate-400 truncate">{client.email}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-green-400">
                  <DollarSign size={14} />
                  {formatCurrency(client.totalIncome)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
