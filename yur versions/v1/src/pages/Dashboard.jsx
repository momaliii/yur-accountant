import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import Card, { StatCard } from '../components/ui/Card';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import currencyService from '../services/currency/currencyService';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { clients, income, expenses, debts } = useDataStore();
  const { baseCurrency, exchangeRates, privacyMode, setPrivacyMode } = useSettingsStore();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter current month data
    const monthlyIncome = income.filter((i) => {
      const date = new Date(i.receivedDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyExpenses = expenses.filter((e) => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Convert all amounts to base currency
    const totalIncome = monthlyIncome.reduce((sum, i) => {
      const amount = i.netAmount || i.amount;
      const converted = currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
      return sum + converted;
    }, 0);
    
    const totalExpenses = monthlyExpenses.reduce((sum, e) => {
      const converted = currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
      return sum + converted;
    }, 0);
    
    const netProfit = totalIncome - totalExpenses;

    // Debts summary (converted to base currency)
    const owedToMe = debts
      .filter((d) => d.type === 'owed_to_me' && d.status !== 'paid')
      .reduce((sum, d) => {
        const converted = currencyService.convert(d.amount, d.currency || baseCurrency, baseCurrency, exchangeRates);
        return sum + converted;
      }, 0);

    const iOwe = debts
      .filter((d) => d.type === 'i_owe' && d.status !== 'paid')
      .reduce((sum, d) => {
        const converted = currencyService.convert(d.amount, d.currency || baseCurrency, baseCurrency, exchangeRates);
        return sum + converted;
      }, 0);

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      clientCount: clients.filter((c) => (c.status || 'active') === 'active').length,
      owedToMe,
      iOwe,
    };
  }, [clients, income, expenses, debts, baseCurrency, exchangeRates]);

  // Monthly trend data for chart
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthIncome = income
        .filter((item) => {
          const d = new Date(item.receivedDate);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, item) => {
          const amount = item.netAmount || item.amount;
          const converted = currencyService.convert(amount, item.currency || baseCurrency, baseCurrency, exchangeRates);
          return sum + converted;
        }, 0);

      const monthExpenses = expenses
        .filter((item) => {
          const d = new Date(item.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, item) => {
          const converted = currencyService.convert(item.amount, item.currency || baseCurrency, baseCurrency, exchangeRates);
          return sum + converted;
        }, 0);

      months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses,
      });
    }
    return months;
  }, [income, expenses]);

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const categories = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      const converted = currencyService.convert(e.amount, e.currency || baseCurrency, baseCurrency, exchangeRates);
      categories[cat] = (categories[cat] || 0) + converted;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [expenses, baseCurrency, exchangeRates]);

  // Income by client
  const incomeByClient = useMemo(() => {
    const clientIncome = {};
    income.forEach((i) => {
      const client = clients.find((c) => c.id === i.clientId);
      const name = client?.name || 'Unknown';
      const amount = i.netAmount || i.amount;
      const converted = currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
      clientIncome[name] = (clientIncome[name] || 0) + converted;
    });
    return Object.entries(clientIncome)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [income, clients, baseCurrency, exchangeRates]);

  const formatCurrency = (amount) => currencyService.formatCurrency(amount, baseCurrency);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
            title={privacyMode ? 'Show data' : 'Hide data'}
            aria-label={privacyMode ? 'Show data' : 'Hide data'}
          >
            {privacyMode ? (
              <EyeOff size={20} className="text-slate-400" />
            ) : (
              <Eye size={20} className="text-slate-400" />
            )}
          </button>
          <div className="text-sm text-slate-400 hidden sm:block">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Income"
          value={<PrivacyValue value={formatCurrency(stats.totalIncome)} />}
          icon={TrendingUp}
          color="green"
          trend="up"
          trendValue="This month"
        />
        <StatCard
          title="Monthly Expenses"
          value={<PrivacyValue value={formatCurrency(stats.totalExpenses)} />}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Net Profit"
          value={<PrivacyValue value={formatCurrency(stats.netProfit)} />}
          icon={Wallet}
          color={stats.netProfit >= 0 ? 'indigo' : 'red'}
        />
        <StatCard
          title="Active Clients"
          value={<PrivacyValue value={stats.clientCount.toString()} placeholder="••" />}
          icon={Users}
          color="cyan"
        />
      </div>

      {/* Debts Summary */}
      {(stats.owedToMe > 0 || stats.iOwe > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-emerald-500">
            <div className="flex items-center gap-3">
              <ArrowDownRight className="text-emerald-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Money Owed to You</p>
                <p className="text-xl font-bold text-emerald-400">
                  <PrivacyValue value={formatCurrency(stats.owedToMe)} />
                </p>
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="text-red-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Money You Owe</p>
                <p className="text-xl font-bold text-red-400">
                  <PrivacyValue value={formatCurrency(stats.iOwe)} />
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Income vs Expenses Trend */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Income vs Expenses (6 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  fill="url(#incomeGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fill="url(#expenseGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
          <div className="h-64">
            {expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No expense data yet</p>
                </div>
              </div>
            )}
          </div>
          {expenseBreakdown.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {expenseBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Clients by Income */}
        <Card className="xl:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Top Clients by Income</h3>
          <div className="h-64">
            {incomeByClient.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeByClient} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Users size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No client income data yet</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

