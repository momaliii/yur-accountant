import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingUp,
  Filter,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import currencyService from '../services/currency/currencyService';

const PAYMENT_METHODS = [
  { value: 'vodafone_cash', label: 'Vodafone Cash', hasFee: true },
  { value: 'fawaterak_international', label: 'Fawaterak (International)', hasFee: true },
  { value: 'fawaterak_card', label: 'Fawaterak (Card Commission)', hasFee: true },
  { value: 'bank', label: 'Bank Transfer', hasFee: false },
  { value: 'instapay', label: 'InstaPay', hasFee: false },
  { value: 'cash', label: 'Cash', hasFee: false },
  { value: 'other', label: 'Other', hasFee: false },
];

const initialFormState = {
  clientId: '',
  amount: '',
  currency: 'EGP',
  paymentMethod: 'bank',
  customFeePercentage: '',
  receivedDate: new Date().toISOString().split('T')[0],
  notes: '',
  adSpend: '',
  projectName: '',
  isDeposit: false,
  isFixedPortionOnly: false,
  taxCategory: null,
  isTaxable: true,
  taxRate: null,
};

export default function Income() {
  const { clients, income, addIncome, updateIncome, deleteIncome } = useDataStore();
  const { baseCurrency, currencies, vfFeePercentage, exchangeRates, privacyMode, setPrivacyMode } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate net amount with fees
  const calculateNetAmount = (amount, paymentMethod, customFee, currency = 'EGP') => {
    if (paymentMethod === 'vodafone_cash') {
      const fee = customFee || vfFeePercentage;
      return amount - (amount * fee) / 100;
    }
    if (paymentMethod === 'fawaterak_international') {
      // International: 2.50% + 2.00 EGP
      const percentageFee = (amount * 2.50) / 100;
      const fixedFee = currency === 'EGP' ? 2.00 : 0; // Fixed fee only applies to EGP
      return amount - percentageFee - fixedFee;
    }
    if (paymentMethod === 'fawaterak_card') {
      // Card Commission: 2% + 2 EGP
      const percentageFee = (amount * 2.00) / 100;
      const fixedFee = currency === 'EGP' ? 2.00 : 0; // Fixed fee only applies to EGP
      return amount - percentageFee - fixedFee;
    }
    return amount;
  };

  // Filter income
  const filteredIncome = useMemo(() => {
    return income.filter((i) => {
      // Client filter
      if (filterClient && i.clientId !== parseInt(filterClient)) return false;

      // Month filter
      if (filterMonth) {
        const incomeDate = new Date(i.receivedDate);
        const [year, month] = filterMonth.split('-');
        if (
          incomeDate.getFullYear() !== parseInt(year) ||
          incomeDate.getMonth() !== parseInt(month) - 1
        )
          return false;
      }

      // Search
      if (searchQuery) {
        const client = clients.find((c) => c.id === i.clientId);
        const searchLower = searchQuery.toLowerCase();
        return (
          client?.name.toLowerCase().includes(searchLower) ||
          i.notes?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [income, filterClient, filterMonth, searchQuery, clients]);

  // Calculate totals (converted to base currency)
  const totals = useMemo(() => {
    const gross = filteredIncome.reduce((sum, i) => {
      const converted = currencyService.convert(i.amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
      return sum + converted;
    }, 0);
    const net = filteredIncome.reduce((sum, i) => {
      const amount = i.netAmount || i.amount;
      const converted = currencyService.convert(amount, i.currency || baseCurrency, baseCurrency, exchangeRates);
      return sum + converted;
    }, 0);
    const fees = gross - net;
    return { gross, net, fees };
  }, [filteredIncome, baseCurrency, exchangeRates]);

  const openAddModal = () => {
    setEditingIncome(null);
    setFormData({
      ...initialFormState,
      receivedDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (incomeItem) => {
    setEditingIncome(incomeItem);
    setFormData({
      clientId: incomeItem.clientId?.toString() || '',
      amount: incomeItem.amount?.toString() || '',
      currency: incomeItem.currency || 'EGP',
      paymentMethod: incomeItem.paymentMethod || 'bank',
      customFeePercentage: incomeItem.feePercentage?.toString() || '',
      receivedDate: incomeItem.receivedDate || new Date().toISOString().split('T')[0],
      notes: incomeItem.notes || '',
      adSpend: incomeItem.adSpend?.toString() || '',
      projectName: incomeItem.projectName || '',
      isDeposit: incomeItem.isDeposit || false,
      isFixedPortionOnly: incomeItem.isFixedPortionOnly || false,
      taxCategory: incomeItem.taxCategory || null,
      isTaxable: incomeItem.isTaxable !== undefined ? incomeItem.isTaxable : true,
      taxRate: incomeItem.taxRate?.toString() || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      let feePercentage = 0;
      let feeAmount = 0;
      
      if (formData.paymentMethod === 'vodafone_cash') {
        feePercentage = formData.customFeePercentage
          ? parseFloat(formData.customFeePercentage)
          : vfFeePercentage;
        feeAmount = (amount * feePercentage) / 100;
      } else if (formData.paymentMethod === 'fawaterak_international') {
        feePercentage = 2.50;
        feeAmount = (amount * 2.50) / 100 + (formData.currency === 'EGP' ? 2.00 : 0);
      } else if (formData.paymentMethod === 'fawaterak_card') {
        feePercentage = 2.00;
        feeAmount = (amount * 2.00) / 100 + (formData.currency === 'EGP' ? 2.00 : 0);
      }
      
      const netAmount = calculateNetAmount(amount, formData.paymentMethod, feePercentage, formData.currency);

      const incomeData = {
        clientId: formData.clientId ? parseInt(formData.clientId) : null,
        amount,
        netAmount,
        currency: formData.currency,
        paymentMethod: formData.paymentMethod,
        feePercentage,
        receivedDate: formData.receivedDate,
        notes: formData.notes,
        adSpend: formData.adSpend ? parseFloat(formData.adSpend) : null,
        projectName: formData.projectName || null,
        isDeposit: formData.isDeposit || false,
        isFixedPortionOnly: formData.isFixedPortionOnly || false,
        taxCategory: formData.taxCategory || null,
        isTaxable: formData.isTaxable !== undefined ? formData.isTaxable : true,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : null,
      };

      if (editingIncome) {
        await updateIncome(editingIncome.id, incomeData);
      } else {
        await addIncome(incomeData);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to save income:', error);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (incomeItem) => {
    if (window.confirm('Are you sure you want to delete this income entry?')) {
      await deleteIncome(incomeItem.id);
    }
  };

  const formatCurrency = (amount, currency) =>
    currencyService.formatCurrency(amount, currency || baseCurrency);

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getPaymentMethodLabel = (method) =>
    PAYMENT_METHODS.find((m) => m.value === method)?.label || method;

  const isPerProjectClient = (clientId) => {
    if (!clientId) return false;
    const client = clients.find((c) => c.id === parseInt(clientId));
    return client?.paymentModel === 'per_project';
  };

  const getSelectedClient = () => {
    if (!formData.clientId) return null;
    return clients.find((c) => c.id === parseInt(formData.clientId));
  };

  const isPercentageBasedClient = () => {
    const client = getSelectedClient();
    return client?.paymentModel === 'percent_only' || client?.paymentModel === 'fixed_plus_percent';
  };

  const isFixedClient = () => {
    const client = getSelectedClient();
    return client?.paymentModel === 'fixed' || client?.paymentModel === 'fixed_plus_percent';
  };

  // Preview calculation
  const previewNet = useMemo(() => {
    if (!formData.amount) return null;
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return null;
    const fee = formData.customFeePercentage
      ? parseFloat(formData.customFeePercentage)
      : vfFeePercentage;
    return calculateNetAmount(amount, formData.paymentMethod, fee, formData.currency);
  }, [formData.amount, formData.paymentMethod, formData.customFeePercentage, formData.currency, vfFeePercentage]);

  // Calculate fee details for preview
  const feeDetails = useMemo(() => {
    if (!formData.amount || !formData.paymentMethod) return null;
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return null;

    if (formData.paymentMethod === 'vodafone_cash') {
      const fee = formData.customFeePercentage
        ? parseFloat(formData.customFeePercentage)
        : vfFeePercentage;
      return {
        percentage: fee,
        fixed: 0,
        total: (amount * fee) / 100,
      };
    }
    if (formData.paymentMethod === 'fawaterak_international') {
      const percentageFee = (amount * 2.50) / 100;
      const fixedFee = formData.currency === 'EGP' ? 2.00 : 0;
      return {
        percentage: 2.50,
        fixed: fixedFee,
        total: percentageFee + fixedFee,
      };
    }
    if (formData.paymentMethod === 'fawaterak_card') {
      const percentageFee = (amount * 2.00) / 100;
      const fixedFee = formData.currency === 'EGP' ? 2.00 : 0;
      return {
        percentage: 2.00,
        fixed: fixedFee,
        total: percentageFee + fixedFee,
      };
    }
    return null;
  }, [formData.amount, formData.paymentMethod, formData.customFeePercentage, formData.currency, vfFeePercentage]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Income</h1>
          <p className="text-slate-400 mt-1">Track your earnings and payment receipts</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button onClick={openAddModal} icon={Plus}>
            Add Income
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-emerald-500">
          <p className="text-slate-400 text-sm">Gross Income</p>
          <p className="text-2xl font-bold text-emerald-400">
            <PrivacyValue value={formatCurrency(totals.gross, baseCurrency)} />
          </p>
        </Card>
        <Card className="border-l-4 border-red-500">
          <p className="text-slate-400 text-sm">Fees Paid</p>
          <p className="text-2xl font-bold text-red-400">
            <PrivacyValue value={formatCurrency(totals.fees, baseCurrency)} />
          </p>
        </Card>
        <Card className="border-l-4 border-indigo-500">
          <p className="text-slate-400 text-sm">Net Income</p>
          <p className="text-2xl font-bold text-indigo-400">
            <PrivacyValue value={formatCurrency(totals.net, baseCurrency)} />
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <Input
            icon={Search}
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[150px]"
        >
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[150px]"
        />
      </div>

      {/* Income Table */}
      <Card padding={false}>
        <div className="overflow-x-auto -mx-6 lg:mx-0">
          <table className="w-full min-w-[600px]">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Date</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Client</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400 hidden md:table-cell">Method</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Amount</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400 hidden lg:table-cell">Net</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredIncome.length > 0 ? (
                filteredIncome.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 md:p-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500 md:hidden" />
                        <span className="text-xs md:text-sm">
                          <span className="md:hidden">
                            {new Date(item.receivedDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </span>
                          <span className="hidden md:inline">
                            {new Date(item.receivedDate).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      {item.clientId ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs md:text-sm truncate max-w-[120px] md:max-w-none block">
                              {getClientName(item.clientId)}
                            </span>
                            {item.isDeposit && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {item.isFixedPortionOnly ? 'Fixed Deposit' : 'Deposit'}
                              </span>
                            )}
                          </div>
                          {item.projectName && (
                            <span className="text-xs text-indigo-400 mt-1 block">
                              Project: {item.projectName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs md:text-sm">No client</span>
                      )}
                    </td>
                    <td className="p-3 md:p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-slate-500" />
                        <span className="text-xs md:text-sm">{getPaymentMethodLabel(item.paymentMethod)}</span>
                        {item.feePercentage > 0 && (
                          <span className="text-xs text-red-400">
                            {item.paymentMethod === 'fawaterak_international' || item.paymentMethod === 'fawaterak_card' ? (
                              <>
                                (-{item.feePercentage}%{item.currency === 'EGP' ? ' + 2 EGP' : ''})
                              </>
                            ) : (
                              <>(-{item.feePercentage}%)</>
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 md:p-4 text-right">
                      <div className="font-medium text-xs md:text-sm">
                        <PrivacyValue value={formatCurrency(item.amount, item.currency)} />
                      </div>
                      {item.feePercentage > 0 && (
                        <div className="text-xs text-red-400 md:hidden mt-1">
                          {getPaymentMethodLabel(item.paymentMethod)} 
                          {item.paymentMethod === 'fawaterak_international' || item.paymentMethod === 'fawaterak_card' ? (
                            <> (-{item.feePercentage}%{item.currency === 'EGP' ? ' + 2 EGP' : ''})</>
                          ) : (
                            <> (-{item.feePercentage}%)</>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 md:p-4 text-right hidden lg:table-cell">
                      <span
                        className={`text-xs md:text-sm ${
                          item.netAmount < item.amount
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        <PrivacyValue value={formatCurrency(item.netAmount || item.amount, item.currency)} />
                      </span>
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex justify-end gap-1 md:gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors"
                          aria-label="Edit"
                        >
                          <Edit2 size={14} className="md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 md:p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} className="md:w-4 md:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <TrendingUp size={40} className="mx-auto mb-2 opacity-50" />
                    <p>No income entries found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIncome ? 'Edit Income' : 'Add New Income'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Client"
            value={formData.clientId}
            onChange={(e) => {
              const newClientId = e.target.value;
              const selectedClient = clients.find(c => c.id === parseInt(newClientId));
              const isPerProject = selectedClient?.paymentModel === 'per_project';
              
              setFormData((prev) => {
                const newData = { 
                  ...prev, 
                  clientId: newClientId,
                  projectName: isPerProject ? prev.projectName : '',
                  // Reset amount and adSpend when client changes
                  amount: '',
                  adSpend: ''
                };
                
                // If percentage-based client, use client's currency
                if (selectedClient && (selectedClient.paymentModel === 'percent_only' || selectedClient.paymentModel === 'fixed_plus_percent')) {
                  newData.currency = selectedClient.currency || prev.currency;
                }
                
                return newData;
              });
            }}
          >
            <option value="">Select a client (optional)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.paymentModel === 'per_project' ? '(Per Project)' : ''}
              </option>
            ))}
          </Select>

          {/* Project Name for Per-Project Clients */}
          {formData.clientId && isPerProjectClient(formData.clientId) && (
            <Input
              label="Project Name *"
              value={formData.projectName || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
              placeholder="e.g., Q4 Campaign, Website Launch, Brand Refresh"
              required
            />
          )}

          {/* Ad Spend Input for Percentage-Based Clients */}
          {isPercentageBasedClient() && !(formData.isDeposit && formData.isFixedPortionOnly) && (
            <div className="space-y-2">
              {getSelectedClient()?.paymentModel === 'fixed_plus_percent' && getSelectedClient()?.fixedAmount && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-2">
                  <p className="text-sm text-blue-300">
                    <span className="font-semibold">Payment Model:</span> Fixed + Percentage
                    <br />
                    <span className="text-xs text-slate-400">
                      Fixed: {formatCurrency(parseFloat(getSelectedClient().fixedAmount), getSelectedClient().currency)} + {getSelectedClient().adSpendPercentage}% of Ad Spend
                    </span>
                  </p>
                </div>
              )}
              <Input
                label={
                  getSelectedClient()?.paymentModel === 'fixed_plus_percent'
                    ? `Ad Spend * (${getSelectedClient()?.adSpendPercentage || 0}% commission + fixed amount)`
                    : `Ad Spend * (${getSelectedClient()?.adSpendPercentage || 0}% commission)`
                }
                type="number"
                step="0.01"
                min="0"
                value={formData.adSpend}
                onChange={(e) => {
                  const adSpendValue = e.target.value;
                  const client = getSelectedClient();
                  
                  setFormData((prev) => {
                    const newData = { ...prev, adSpend: adSpendValue };
                    
                    // Auto-calculate amount based on ad spend and percentage
                    if (adSpendValue && client?.adSpendPercentage) {
                      const adSpend = parseFloat(adSpendValue);
                      if (!isNaN(adSpend) && adSpend > 0) {
                        // Calculate percentage portion
                        let calculatedAmount = (adSpend * client.adSpendPercentage) / 100;
                        
                        // If fixed_plus_percent, add fixed amount (unless it's fixed portion only deposit)
                        if (client.paymentModel === 'fixed_plus_percent' && client.fixedAmount && !prev.isFixedPortionOnly) {
                          calculatedAmount += parseFloat(client.fixedAmount);
                        }
                        
                        newData.amount = calculatedAmount.toFixed(2);
                      } else {
                        // If ad spend is 0 or empty, for fixed_plus_percent, still show fixed amount
                        if (client.paymentModel === 'fixed_plus_percent' && client.fixedAmount && !prev.isFixedPortionOnly) {
                          newData.amount = parseFloat(client.fixedAmount).toFixed(2);
                        } else {
                          newData.amount = '';
                        }
                      }
                    } else {
                      // If no percentage, but fixed_plus_percent with fixed amount, show fixed amount
                      if (client?.paymentModel === 'fixed_plus_percent' && client?.fixedAmount && !prev.isFixedPortionOnly) {
                        newData.amount = parseFloat(client.fixedAmount).toFixed(2);
                      } else {
                        newData.amount = '';
                      }
                    }
                    
                    return newData;
                  });
                }}
                placeholder="Enter total ad spend amount"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={
                formData.isDeposit && formData.isFixedPortionOnly
                  ? "Fixed Portion Deposit *"
                  : isPercentageBasedClient() && !formData.isFixedPortionOnly
                  ? "Calculated Amount *"
                  : "Amount *"
              }
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              required
              disabled={
                (isPercentageBasedClient() && formData.adSpend && !formData.isFixedPortionOnly)
              }
              className={
                (isPercentageBasedClient() && formData.adSpend && !formData.isFixedPortionOnly)
                  ? 'opacity-75' : ''
              }
            />
            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          {/* Deposit Info for Fixed Portion Only (Fixed + % Clients) */}
          {formData.isDeposit && formData.isFixedPortionOnly && getSelectedClient()?.paymentModel === 'fixed_plus_percent' && formData.amount && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">Deposit Type:</span> Fixed Portion Deposit
                <br />
                <span className="text-slate-400">Deposit Amount:</span> {formatCurrency(parseFloat(formData.amount), formData.currency)}
                <br />
                <span className="text-slate-400">Fixed Amount:</span> {formatCurrency(parseFloat(getSelectedClient().fixedAmount), formData.currency)}
                {parseFloat(formData.amount) < parseFloat(getSelectedClient().fixedAmount) && (
                  <>
                    <br />
                    <span className="text-amber-400">
                      Remaining Fixed: {formatCurrency(parseFloat(getSelectedClient().fixedAmount) - parseFloat(formData.amount), formData.currency)}
                    </span>
                  </>
                )}
                <br />
                <span className="text-xs text-slate-400 mt-1 block">
                  The percentage portion will be calculated and paid later based on ad spend
                </span>
              </p>
            </div>
          )}

          {/* Deposit Info for Fixed Amount Clients */}
          {formData.isDeposit && getSelectedClient()?.paymentModel === 'fixed' && getSelectedClient()?.fixedAmount && formData.amount && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">Deposit Type:</span> Fixed Amount Deposit
                <br />
                <span className="text-slate-400">Deposit Amount:</span> {formatCurrency(parseFloat(formData.amount), formData.currency)}
                <br />
                <span className="text-slate-400">Total Fixed Amount:</span> {formatCurrency(parseFloat(getSelectedClient().fixedAmount), formData.currency)}
                {parseFloat(formData.amount) < parseFloat(getSelectedClient().fixedAmount) && (
                  <>
                    <br />
                    <span className="text-amber-400">
                      Remaining: {formatCurrency(parseFloat(getSelectedClient().fixedAmount) - parseFloat(formData.amount), formData.currency)}
                    </span>
                    <br />
                    <span className="text-xs text-slate-300 mt-1 block">
                      Deposit covers: {((parseFloat(formData.amount) / parseFloat(getSelectedClient().fixedAmount)) * 100).toFixed(1)}% of total fixed amount
                    </span>
                  </>
                )}
                {parseFloat(formData.amount) >= parseFloat(getSelectedClient().fixedAmount) && (
                  <span className="text-xs text-emerald-400 mt-1 block">
                    ✓ Full payment received
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Calculation Preview for Percentage-Based Clients */}
          {isPercentageBasedClient() && formData.adSpend && formData.amount && !formData.isFixedPortionOnly && (
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-sm text-indigo-300">
                <span className="font-semibold">Calculation:</span>
                {getSelectedClient()?.paymentModel === 'fixed_plus_percent' && getSelectedClient()?.fixedAmount ? (
                  <>
                    <br />
                    <span className="text-slate-400">Fixed Amount:</span> {formatCurrency(parseFloat(getSelectedClient().fixedAmount), formData.currency)}
                    <br />
                    <span className="text-slate-400">+ Percentage:</span> {formatCurrency(parseFloat(formData.adSpend), formData.currency)} (Ad Spend) × {getSelectedClient()?.adSpendPercentage}% = {formatCurrency((parseFloat(formData.adSpend) * (getSelectedClient()?.adSpendPercentage || 0)) / 100, formData.currency)}
                    <br />
                    <span className="text-slate-400">= Total Amount:</span>{' '}
                    <span className="font-bold text-white text-base">
                      {formatCurrency(parseFloat(formData.amount), formData.currency)}
                    </span>
                  </>
                ) : (
                  <>
                    {' '}
                    {formatCurrency(parseFloat(formData.adSpend), formData.currency)} (Ad Spend) × {getSelectedClient()?.adSpendPercentage}% ={' '}
                    <span className="font-bold text-white">
                      {formatCurrency(parseFloat(formData.amount), formData.currency)}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Payment Method *"
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))
              }
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Input
              label="Date *"
              type="date"
              value={formData.receivedDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, receivedDate: e.target.value }))
              }
              required
            />
          </div>

          {formData.paymentMethod === 'vodafone_cash' && (
            <Input
              label={`Fee Percentage (default: ${vfFeePercentage}%)`}
              type="number"
              step="0.1"
              value={formData.customFeePercentage}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customFeePercentage: e.target.value }))
              }
              placeholder={vfFeePercentage.toString()}
            />
          )}

          {/* Net Amount Preview */}
          {formData.paymentMethod === 'vodafone_cash' && previewNet !== null && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-300">
                After {formData.customFeePercentage || vfFeePercentage}% fee:
                <span className="font-bold ml-2">
                  {formatCurrency(previewNet, formData.currency)}
                </span>
              </p>
            </div>
          )}

          {/* Fawaterak Fee Preview */}
          {(formData.paymentMethod === 'fawaterak_international' || formData.paymentMethod === 'fawaterak_card') && feeDetails && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-300 mb-1">
                Fee breakdown:
              </p>
              <div className="text-xs text-amber-200/80 space-y-1 ml-2">
                <p>
                  Percentage fee ({feeDetails.percentage}%): {formatCurrency(feeDetails.total - feeDetails.fixed, formData.currency)}
                </p>
                {feeDetails.fixed > 0 && (
                  <p>
                    Fixed fee: {formatCurrency(feeDetails.fixed, formData.currency)}
                  </p>
                )}
                <p className="font-semibold text-amber-300 mt-2">
                  Total fee: {formatCurrency(feeDetails.total, formData.currency)}
                </p>
                <p className="font-bold text-amber-200 mt-2">
                  Net amount after fees: {formatCurrency(previewNet, formData.currency)}
                </p>
              </div>
            </div>
          )}

          {/* Deposit Options for Fixed Clients */}
          {isFixedClient() && (
            <div className="space-y-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDeposit"
                  checked={formData.isDeposit}
                  onChange={(e) => {
                    const isDeposit = e.target.checked;
                      setFormData((prev) => {
                        const newData = { ...prev, isDeposit };
                        const client = getSelectedClient();
                        
                        // If it's a Fixed + % client and deposit is checked, suggest fixed portion
                        if (isDeposit && client?.paymentModel === 'fixed_plus_percent' && client?.fixedAmount) {
                          // Pre-fill with fixed amount, but allow user to edit it
                          if (!prev.amount || prev.amount === '') {
                            newData.amount = parseFloat(client.fixedAmount).toFixed(2);
                          }
                          newData.isFixedPortionOnly = true;
                          newData.adSpend = ''; // Clear ad spend for fixed portion only deposit
                        } 
                        // If it's a Fixed-only client and deposit is checked, pre-fill with fixed amount
                        else if (isDeposit && client?.paymentModel === 'fixed' && client?.fixedAmount) {
                          // Pre-fill with fixed amount, but allow user to edit it for partial deposits
                          if (!prev.amount || prev.amount === '') {
                            newData.amount = parseFloat(client.fixedAmount).toFixed(2);
                          }
                        } 
                        else if (!isDeposit) {
                          newData.isFixedPortionOnly = false;
                        }
                        
                        return newData;
                      });
                  }}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-2"
                />
                <label htmlFor="isDeposit" className="text-sm text-blue-300 cursor-pointer flex-1">
                  <span className="font-semibold">This is a deposit payment</span>
                  <br />
                  <span className="text-xs text-slate-400">
                    Mark this if the client is paying a deposit/advance payment
                  </span>
                </label>
              </div>
              
              {/* Fixed Portion Only Option for Fixed + % Clients */}
              {formData.isDeposit && getSelectedClient()?.paymentModel === 'fixed_plus_percent' && getSelectedClient()?.fixedAmount && (
                <div className="ml-8 p-2 rounded bg-blue-500/20 border border-blue-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFixedPortionOnly"
                      checked={formData.isFixedPortionOnly}
                      onChange={(e) => {
                        const isFixedOnly = e.target.checked;
                        setFormData((prev) => {
                          const newData = { ...prev, isFixedPortionOnly: isFixedOnly };
                          
                          if (isFixedOnly) {
                            // Pre-fill with full fixed amount, but allow editing
                            newData.amount = parseFloat(getSelectedClient().fixedAmount).toFixed(2);
                            newData.adSpend = ''; // Clear ad spend
                          } else {
                            // Reset to allow full calculation
                            newData.amount = '';
                          }
                          
                          return newData;
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-2"
                    />
                    <label htmlFor="isFixedPortionOnly" className="text-xs text-blue-200 cursor-pointer">
                      Deposit for fixed portion only
                      <br />
                      <span className="text-slate-400">You can enter any amount up to {formatCurrency(parseFloat(getSelectedClient().fixedAmount), getSelectedClient().currency)}</span>
                    </label>
                  </div>
                  {formData.isFixedPortionOnly && (
                    <div className="ml-6 text-xs text-slate-400">
                      <p>Fixed amount: {formatCurrency(parseFloat(getSelectedClient().fixedAmount), getSelectedClient().currency)}</p>
                      {formData.amount && parseFloat(formData.amount) > 0 && (
                        <p className="mt-1">
                          Deposit covers: {((parseFloat(formData.amount) / parseFloat(getSelectedClient().fixedAmount)) * 100).toFixed(1)}% of fixed amount
                          {parseFloat(formData.amount) < parseFloat(getSelectedClient().fixedAmount) && (
                            <span className="text-amber-400 ml-1">
                              (Remaining: {formatCurrency(parseFloat(getSelectedClient().fixedAmount) - parseFloat(formData.amount), getSelectedClient().currency)})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Deposit Info for Fixed-Only Clients */}
              {formData.isDeposit && getSelectedClient()?.paymentModel === 'fixed' && getSelectedClient()?.fixedAmount && formData.amount && (
                <div className="ml-8 p-2 rounded bg-blue-500/20 border border-blue-500/30">
                  <div className="text-xs text-blue-200">
                    <p className="font-semibold mb-1">Deposit Details:</p>
                    <p className="text-slate-300">
                      Fixed Amount: {formatCurrency(parseFloat(getSelectedClient().fixedAmount), getSelectedClient().currency)}
                    </p>
                    {formData.amount && parseFloat(formData.amount) > 0 && (
                      <>
                        <p className="text-slate-300 mt-1">
                          Deposit: {formatCurrency(parseFloat(formData.amount), formData.currency)}
                        </p>
                        <p className="text-slate-300 mt-1">
                          Covers: {((parseFloat(formData.amount) / parseFloat(getSelectedClient().fixedAmount)) * 100).toFixed(1)}% of total
                        </p>
                        {parseFloat(formData.amount) < parseFloat(getSelectedClient().fixedAmount) && (
                          <p className="text-amber-400 mt-1 font-semibold">
                            Remaining: {formatCurrency(parseFloat(getSelectedClient().fixedAmount) - parseFloat(formData.amount), formData.currency)}
                          </p>
                        )}
                        {parseFloat(formData.amount) >= parseFloat(getSelectedClient().fixedAmount) && (
                          <p className="text-emerald-400 mt-1 font-semibold">
                            ✓ Full payment received
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ad Spend for non-percentage clients (optional) */}
          {!isPercentageBasedClient() && (
            <Input
              label="Ad Spend (optional)"
              type="number"
              step="0.01"
              value={formData.adSpend}
              onChange={(e) => setFormData((prev) => ({ ...prev, adSpend: e.target.value }))}
              placeholder="Track ad spend for reference"
            />
          )}

          {/* Tax Information */}
          <div className="pt-2 border-t border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Tax Information (Optional)
            </h3>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <input
                type="checkbox"
                id="isTaxable"
                checked={formData.isTaxable}
                onChange={(e) => setFormData((prev) => ({ ...prev, isTaxable: e.target.checked }))}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-2"
              />
              <label htmlFor="isTaxable" className="text-sm text-slate-300 cursor-pointer flex-1">
                This income is taxable
              </label>
            </div>
            {formData.isTaxable && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Tax Category (Optional)"
                  value={formData.taxCategory || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, taxCategory: e.target.value || null }))}
                >
                  <option value="">Select category</option>
                  <option value="business_income">Business Income</option>
                  <option value="freelance">Freelance Income</option>
                  <option value="consulting">Consulting Fees</option>
                  <option value="commission">Commission</option>
                  <option value="other">Other</option>
                </Select>
                <Input
                  label="Tax Rate % (Optional)"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxRate || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, taxRate: e.target.value }))}
                  placeholder="e.g., 14 for 14%"
                />
              </div>
            )}
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {editingIncome ? 'Update Income' : 'Add Income'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

