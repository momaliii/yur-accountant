import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import currencyService from '../services/currency/currencyService';

const initialFormState = {
  clientId: '',
  expectedAmount: '',
  currency: 'EGP',
  notes: '',
};

export default function ExpectedIncome() {
  const { clients, income, expectedIncome, addExpectedIncome, updateExpectedIncome, deleteExpectedIncome } = useDataStore();
  const { baseCurrency, currencies, exchangeRates, privacyMode, setPrivacyMode } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpectedIncome, setEditingExpectedIncome] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set current month as default period
  useEffect(() => {
    if (!selectedPeriod) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setSelectedPeriod(`${year}-${month}`);
    }
  }, [selectedPeriod]);

  // Get expected income for selected period
  const periodExpectedIncome = useMemo(() => {
    if (!selectedPeriod) return [];
    return expectedIncome.filter((ei) => ei.period === selectedPeriod);
  }, [expectedIncome, selectedPeriod]);

  // Get actual income for selected period
  const periodActualIncome = useMemo(() => {
    if (!selectedPeriod) return [];
    const [year, month] = selectedPeriod.split('-');
    const targetYear = parseInt(year);
    const targetMonth = parseInt(month) - 1; // JavaScript months are 0-indexed
    
    return income.filter((i) => {
      if (!i.receivedDate) return false;
      
      // Handle both ISO string dates and Date objects
      const date = i.receivedDate instanceof Date 
        ? i.receivedDate 
        : new Date(i.receivedDate);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return false;
      
      return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
    });
  }, [income, selectedPeriod]);

  // Combine expected income with client info and actual income
  const expectedIncomeWithDetails = useMemo(() => {
    const activeClients = clients.filter((c) => (c.status || 'active') === 'active');
    
    return activeClients.map((client) => {
      // Ensure type consistency for comparison
      const clientId = typeof client.id === 'string' ? parseInt(client.id) : client.id;
      const expected = periodExpectedIncome.find((ei) => {
        const eiClientId = typeof ei.clientId === 'string' ? parseInt(ei.clientId) : ei.clientId;
        return eiClientId === clientId;
      });
      const actual = periodActualIncome.filter((i) => {
        // Skip income records without clientId
        if (i.clientId === null || i.clientId === undefined) return false;
        const iClientId = typeof i.clientId === 'string' ? parseInt(i.clientId) : i.clientId;
        return iClientId === clientId;
      });
      const actualTotal = actual.reduce((sum, i) => {
        const amount = i.netAmount || i.amount || 0;
        if (!amount || isNaN(amount)) return sum;
        return sum + currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
      }, 0);
      
      const expectedAmount = expected
        ? currencyService.convert(expected.expectedAmount, expected.currency || baseCurrency, baseCurrency, exchangeRates)
        : 0;
      
      const isPaid = expected && actualTotal >= expectedAmount * 0.95; // 95% threshold
      const difference = actualTotal - expectedAmount;
      
      return {
        client,
        expected,
        actualTotal,
        expectedAmount,
        isPaid,
        difference,
        actualCount: actual.length,
      };
    }).filter((item) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.client.name.toLowerCase().includes(query) ||
               item.expected?.notes?.toLowerCase().includes(query);
      }
      // Show only clients with expected income or all if no filter
      return true;
    });
  }, [clients, periodExpectedIncome, periodActualIncome, baseCurrency, exchangeRates, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    const expected = expectedIncomeWithDetails.reduce((sum, item) => sum + item.expectedAmount, 0);
    const actual = expectedIncomeWithDetails.reduce((sum, item) => sum + item.actualTotal, 0);
    const paid = expectedIncomeWithDetails.filter((item) => item.isPaid && item.expectedAmount > 0).length;
    const pending = expectedIncomeWithDetails.filter((item) => !item.isPaid && item.expectedAmount > 0).length;
    
    return {
      expected,
      actual,
      difference: actual - expected,
      paid,
      pending,
      total: expectedIncomeWithDetails.length,
    };
  }, [expectedIncomeWithDetails]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const openAddModal = (clientId = null) => {
    setEditingExpectedIncome(null);
    setFormData({
      ...initialFormState,
      clientId: clientId || '',
      currency: baseCurrency,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (expectedIncomeItem) => {
    setEditingExpectedIncome(expectedIncomeItem);
    setFormData({
      clientId: expectedIncomeItem.clientId.toString(),
      expectedAmount: expectedIncomeItem.expectedAmount.toString(),
      currency: expectedIncomeItem.currency || baseCurrency,
      notes: expectedIncomeItem.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const expectedAmount = parseFloat(formData.expectedAmount);
      
      const expectedIncomeData = {
        clientId: parseInt(formData.clientId),
        period: selectedPeriod,
        expectedAmount,
        currency: formData.currency,
        notes: formData.notes || null,
      };

      if (editingExpectedIncome) {
        await updateExpectedIncome(editingExpectedIncome.id, expectedIncomeData);
      } else {
        await addExpectedIncome(expectedIncomeData);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to save expected income:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل المتوقع؟')) {
      try {
        await deleteExpectedIncome(id);
      } catch (error) {
        console.error('Failed to delete expected income:', error);
      }
    }
  };

  // Generate period options (last 12 months)
  const periodOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const period = `${year}-${month}`;
      const monthName = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      options.push({ value: period, label: monthName });
    }
    return options;
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            الدخل المتوقع
          </h1>
          <p className="text-slate-400 mt-1">تتبع المدفوعات المتوقعة من العملاء</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPrivacyMode(!privacyMode)}
            className="flex items-center gap-2"
          >
            {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button onClick={() => openAddModal()} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة متوقع
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select
              label="الفترة"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <Input
              type="text"
              placeholder="بحث عن عميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="المتوقع"
          value={totals.expected}
          formatCurrency={formatCurrency}
          icon={TrendingUp}
          color="indigo"
          privacyMode={privacyMode}
        />
        <StatCard
          title="الفعلي"
          value={totals.actual}
          formatCurrency={formatCurrency}
          icon={DollarSign}
          color="emerald"
          privacyMode={privacyMode}
        />
        <StatCard
          title="الفرق"
          value={totals.difference}
          formatCurrency={formatCurrency}
          icon={totals.difference >= 0 ? CheckCircle2 : AlertCircle}
          color={totals.difference >= 0 ? 'emerald' : 'red'}
          privacyMode={privacyMode}
        />
        <StatCard
          title="تم الدفع"
          value={`${totals.paid}/${totals.pending + totals.paid}`}
          formatCurrency={(v) => v}
          icon={CheckCircle2}
          color="cyan"
          privacyMode={privacyMode}
        />
      </div>

      {/* Expected Income List */}
      <Card padding={false}>
        <div className="overflow-x-auto -mx-6 lg:mx-0">
          <table className="w-full min-w-[800px]">
            <thead className="bg-white/5">
              <tr>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Client</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Expected</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Actual</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Difference</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Status</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400 hidden md:table-cell">Notes</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expectedIncomeWithDetails.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    {searchQuery ? 'لا توجد نتائج' : 'لا توجد توقعات لهذه الفترة'}
                  </td>
                </tr>
              ) : (
                expectedIncomeWithDetails.map((item) => (
                  <tr key={item.client.id} className="hover:bg-white/5 transition-colors">
                    <td className="text-right p-3 md:p-4">
                      <div className="font-medium text-slate-200">{item.client.name}</div>
                    </td>
                    <td className="text-right p-3 md:p-4">
                      {item.expectedAmount > 0 ? (
                        <PrivacyValue value={formatCurrency(item.expectedAmount)} privacyMode={privacyMode} />
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="text-right p-3 md:p-4">
                      <div className="text-right">
                        <PrivacyValue value={formatCurrency(item.actualTotal)} privacyMode={privacyMode} />
                        {item.actualCount > 0 && (
                          <span className="text-xs text-slate-500 block mt-1">({item.actualCount} دفعة)</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right p-3 md:p-4">
                      <span className={item.difference >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {item.expectedAmount > 0 ? (
                          <PrivacyValue
                            value={`${item.difference >= 0 ? '+' : ''}${formatCurrency(item.difference)}`}
                            privacyMode={privacyMode}
                          />
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </span>
                    </td>
                    <td className="text-right p-3 md:p-4">
                      {item.expectedAmount > 0 ? (
                        <div className="flex items-center gap-2 justify-end">
                          {item.isPaid ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 text-sm">تم الدفع</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-amber-400" />
                              <span className="text-amber-400 text-sm">معلق</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="text-right p-3 md:p-4 hidden md:table-cell">
                      <span className="text-sm text-slate-400 truncate max-w-xs block text-right">
                        {item.expected?.notes || '-'}
                      </span>
                    </td>
                    <td className="text-right p-3 md:p-4">
                      <div className="flex items-center gap-2 justify-end">
                        {item.expected ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(item.expected)}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.expected.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAddModal(item.client.id)}
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData(initialFormState);
        }}
        title={editingExpectedIncome ? 'تعديل الدخل المتوقع' : 'إضافة دخل متوقع'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="العميل"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            required
          >
            <option value="">اختر عميل...</option>
            {clients
              .filter((c) => (c.status || 'active') === 'active')
              .map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="المبلغ المتوقع"
              value={formData.expectedAmount}
              onChange={(e) => setFormData({ ...formData, expectedAmount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
            <Select
              label="العملة"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="ملاحظات"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                setFormData(initialFormState);
              }}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingExpectedIncome ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ title, value, formatCurrency, icon: Icon, color, privacyMode }) {
  const colorClasses = {
    indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-400',
    emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
    cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold">
            <PrivacyValue value={formatCurrency(value)} privacyMode={privacyMode} />
          </p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </Card>
  );
}
