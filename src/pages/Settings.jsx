import { useState, useRef, useEffect } from 'react';
import { 
  Key, 
  DollarSign, 
  Percent, 
  Download, 
  Upload, 
  RefreshCw,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Receipt,
  Calendar,
  PlayCircle,
  Trash2,
  Edit2,
  Plus,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useSettingsStore, useDataStore } from '../stores/useStore';
import { backupDB } from '../services/db/database';
import currencyService from '../services/currency/currencyService';
import notificationService from '../services/notifications/notificationService';

export default function Settings() {
  const {
    openaiApiKey,
    baseCurrency,
    vfFeePercentage,
    currencies,
    exchangeRates,
    lastRateUpdate,
    privacyMode,
    notificationsEnabled,
    notificationPermission,
    setOpenaiApiKey,
    setBaseCurrency,
    setVfFeePercentage,
    setExchangeRates,
    setPrivacyMode,
    setNotificationsEnabled,
    setNotificationPermission,
    vatRate,
    setVatRate,
    taxYear,
    setTaxYear,
    setHasSeenOnboarding,
  } = useSettingsStore();
  
  const { openingBalances, addOpeningBalance, updateOpeningBalance, deleteOpeningBalance } = useDataStore();

  const [localApiKey, setLocalApiKey] = useState(openaiApiKey);
  const [localVfFee, setLocalVfFee] = useState(vfFeePercentage.toString());
  const [localVatRate, setLocalVatRate] = useState(vatRate?.toString() || '0');
  const [localTaxYear, setLocalTaxYear] = useState(taxYear?.toString() || new Date().getFullYear().toString());
  const [saveStatus, setSaveStatus] = useState(null);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const fileInputRef = useRef(null);
  
  // Opening Balance state
  const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState(null);
  const [balanceForm, setBalanceForm] = useState({
    periodType: 'month',
    period: '',
    amount: '',
    currency: baseCurrency,
    notes: '',
  });

  const handleSaveApiKey = () => {
    setOpenaiApiKey(localApiKey);
    setSaveStatus('api');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleSaveVfFee = () => {
    const fee = parseFloat(localVfFee);
    if (!isNaN(fee) && fee >= 0 && fee <= 100) {
      setVfFeePercentage(fee);
      setSaveStatus('vf');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const handleUpdateRates = async () => {
    setIsUpdatingRates(true);
    try {
      const rates = await currencyService.getExchangeRates('USD');
      setExchangeRates(rates);
      setSaveStatus('rates');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to update rates:', error);
    }
    setIsUpdatingRates(false);
  };

  const handleExportData = async () => {
    try {
      const data = await backupDB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media-buyer-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Import file selected:', file.name, file.size, 'bytes');

    try {
      const text = await file.text();
      console.log('File read, length:', text.length);
      console.log('First 500 chars of file:', text.substring(0, 500));
      
      const data = JSON.parse(text);
      console.log('JSON parsed successfully. Data keys:', Object.keys(data));
      console.log('Data counts:', {
        clients: data.clients?.length || 0,
        income: data.income?.length || 0,
        expenses: data.expenses?.length || 0,
        debts: data.debts?.length || 0,
        goals: data.goals?.length || 0,
      });
      console.log('Sample client (first item):', data.clients?.[0]);
      console.log('Sample income (first item):', data.income?.[0]);
      
      // Validate that we actually have data (at least one category should have data)
      const hasData = (data.clients && data.clients.length > 0) ||
                     (data.income && data.income.length > 0) ||
                     (data.expenses && data.expenses.length > 0) ||
                     (data.debts && data.debts.length > 0) ||
                     (data.goals && data.goals.length > 0);
      
      if (!hasData) {
        console.error('ERROR: No data in backup file!');
        throw new Error('Backup file appears to be empty or invalid. No data found.');
      }
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid backup file format');
      }
      
      // Confirm before importing
      const confirmed = window.confirm(
        'This will replace all existing data. Are you sure you want to continue?'
      );
      
      if (!confirmed) {
        console.log('Import cancelled by user');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      console.log('Starting import...');
      console.log('Data being passed to importAll:', {
        clientsCount: data.clients?.length || 0,
        incomeCount: data.income?.length || 0,
        expensesCount: data.expenses?.length || 0,
        firstClient: data.clients?.[0],
        firstIncome: data.income?.[0],
      });
      
      // Make a deep copy to ensure data isn't modified
      const dataCopy = JSON.parse(JSON.stringify(data));
      console.log('Data copy made, counts:', {
        clients: dataCopy.clients?.length || 0,
        income: dataCopy.income?.length || 0,
      });
      
      await backupDB.importAll(dataCopy);
      console.log('Import completed successfully');
      
      // Reload data from IndexedDB to ensure it's displayed
      const { initializeData } = useDataStore.getState();
      await initializeData();
      console.log('Data reinitialized after import');
      
      // Show success message
      setSaveStatus('import');
      setTimeout(() => {
        setSaveStatus(null);
        // Reload after a short delay to show success message
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Failed to import data: ${error.message || 'Please check the file format.'}`);
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Check notification permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await notificationService.checkPermission();
      if (permission) {
        setNotificationPermission(permission);
      }
    };
    checkPermission();
  }, [setNotificationPermission]);

  const handleRequestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setNotificationPermission('granted');
      setNotificationsEnabled(true);
      // Test notification
      await notificationService.showNotification('Notifications Enabled', {
        body: 'You will now receive reminders for overdue debts, recurring expenses, and goal progress.',
      });
    } else {
      setNotificationPermission('denied');
    }
  };

  // Opening Balance handlers
  const openAddBalanceModal = () => {
    setEditingBalance(null);
    const now = new Date();
    setBalanceForm({
      periodType: 'month',
      period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      amount: '',
      currency: baseCurrency,
      notes: '',
    });
    setIsOpeningBalanceModalOpen(true);
  };

  const openEditBalanceModal = (balance) => {
    setEditingBalance(balance);
    setBalanceForm({
      periodType: balance.periodType,
      period: balance.period,
      amount: balance.amount.toString(),
      currency: balance.currency || baseCurrency,
      notes: balance.notes || '',
    });
    setIsOpeningBalanceModalOpen(true);
  };

  const handleSaveBalance = async (e) => {
    e.preventDefault();
    try {
      const balanceData = {
        periodType: balanceForm.periodType,
        period: balanceForm.period,
        amount: parseFloat(balanceForm.amount),
        currency: balanceForm.currency,
        notes: balanceForm.notes || '',
      };

      if (editingBalance) {
        await updateOpeningBalance(editingBalance.id, balanceData);
      } else {
        await addOpeningBalance(balanceData);
      }

      setIsOpeningBalanceModalOpen(false);
      setBalanceForm({
        periodType: 'month',
        period: '',
        amount: '',
        currency: baseCurrency,
        notes: '',
      });
    } catch (error) {
      console.error('Failed to save opening balance:', error);
      alert('Failed to save opening balance. Please try again.');
    }
  };

  const handleDeleteBalance = async (id) => {
    if (window.confirm('Are you sure you want to delete this opening balance?')) {
      await deleteOpeningBalance(id);
    }
  };

  const formatCurrency = (amount, currency) => currencyService.formatCurrency(amount, currency || baseCurrency);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl w-full">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-slate-400 mt-1">Configure your dashboard preferences</p>
      </div>

      {/* Privacy Mode */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            {privacyMode ? <EyeOff size={24} className="text-white" /> : <Eye size={24} className="text-white" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Privacy Mode</h3>
            <p className="text-sm text-slate-400 mb-4">
              Hide or blur sensitive financial data when sharing your screen or in public
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={privacyMode}
                    onChange={(e) => setPrivacyMode(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-7 rounded-full transition-colors duration-200 ${
                      privacyMode ? 'bg-indigo-500' : 'bg-slate-600'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        privacyMode ? 'translate-x-7' : 'translate-x-1'
                      } mt-0.5`}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-300">
                  {privacyMode ? 'Privacy Mode ON' : 'Privacy Mode OFF'}
                </span>
              </label>
            </div>
            {privacyMode && (
              <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
                <AlertCircle size={14} />
                All financial amounts and sensitive data are now hidden/blurred
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            {notificationsEnabled ? <Bell size={24} className="text-white" /> : <BellOff size={24} className="text-white" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Notifications</h3>
            <p className="text-sm text-slate-400 mb-4">
              Get browser notifications for overdue debts, recurring expenses, and goal progress
            </p>
            <div className="space-y-3">
              {notificationPermission === 'default' && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-300 mb-2">
                    Browser notifications are not enabled. Click below to enable them.
                  </p>
                  <Button onClick={handleRequestNotificationPermission} variant="secondary" size="sm">
                    Enable Notifications
                  </Button>
                </div>
              )}
              {notificationPermission === 'denied' && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300 mb-2">
                    Notifications are blocked. Please enable them in your browser settings.
                  </p>
                </div>
              )}
              {notificationPermission === 'granted' && (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={(e) => setNotificationsEnabled(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-14 h-7 rounded-full transition-colors duration-200 ${
                          notificationsEnabled ? 'bg-indigo-500' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                          } mt-0.5`}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      {notificationsEnabled ? 'Notifications ON' : 'Notifications OFF'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* OpenAI API Key */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Key size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">OpenAI API Key</h3>
            <p className="text-sm text-slate-400 mb-4">
              Required for AI features like predictions, insights, and chatbot
            </p>
            <div className="flex gap-3">
              <Input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1"
              />
              <Button onClick={handleSaveApiKey}>
                {saveStatus === 'api' ? <Check size={18} /> : 'Save'}
              </Button>
            </div>
            {!openaiApiKey && (
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                <AlertCircle size={14} />
                AI features won't work without an API key
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Base Currency */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <DollarSign size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Base Currency</h3>
            <p className="text-sm text-slate-400 mb-4">
              All amounts will be converted to this currency for reporting
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <Button 
                onClick={handleUpdateRates} 
                variant="secondary"
                loading={isUpdatingRates}
              >
                <RefreshCw size={18} />
                Update Rates
              </Button>
            </div>
            {lastRateUpdate && (
              <p className="text-xs text-slate-500 mt-2">
                Last updated: {new Date(lastRateUpdate).toLocaleString()}
              </p>
            )}
            {saveStatus === 'rates' && (
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <Check size={14} />
                Exchange rates updated successfully
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Vodafone Cash Fee */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Percent size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Vodafone Cash Fee</h3>
            <p className="text-sm text-slate-400 mb-4">
              Default fee percentage for VF Cash payments (1-1.5%)
            </p>
            <div className="flex gap-3">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={localVfFee}
                onChange={(e) => setLocalVfFee(e.target.value)}
                className="w-32"
              />
              <Button onClick={handleSaveVfFee}>
                {saveStatus === 'vf' ? <Check size={18} /> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tax Settings */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Receipt size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Tax Settings</h3>
            <p className="text-sm text-slate-400 mb-4">
              Configure VAT/GST rate and tax year for tax reporting
            </p>
            <div className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    label="VAT/GST Rate %"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={localVatRate}
                    onChange={(e) => setLocalVatRate(e.target.value)}
                    placeholder="e.g., 14 for 14%"
                  />
                </div>
                <Button
                  onClick={() => {
                    const rate = parseFloat(localVatRate);
                    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
                      setVatRate(rate);
                      setSaveStatus('vat');
                      setTimeout(() => setSaveStatus(null), 2000);
                    }
                  }}
                >
                  {saveStatus === 'vat' ? <Check size={18} /> : 'Save'}
                </Button>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    label="Tax Year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={localTaxYear}
                    onChange={(e) => setLocalTaxYear(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => {
                    const year = parseInt(localTaxYear);
                    if (!isNaN(year) && year >= 2000 && year <= 2100) {
                      setTaxYear(year);
                      setSaveStatus('taxYear');
                      setTimeout(() => setSaveStatus(null), 2000);
                    }
                  }}
                >
                  {saveStatus === 'taxYear' ? <Check size={18} /> : 'Save'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              VAT/GST rate is used to calculate estimated tax in tax reports
            </p>
          </div>
        </div>
      </Card>

      {/* Data Backup */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Data Backup & Restore</h3>
        <p className="text-sm text-slate-400 mb-4">
          Export your data for backup or import from a previous backup
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExportData} icon={Download}>
            Export Data
          </Button>
          <Button 
            onClick={handleImportClick} 
            variant="secondary" 
            icon={Upload}
          >
            {saveStatus === 'import' ? (
              <>
                <Check size={18} />
                Importing...
              </>
            ) : (
              'Import Data'
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="hidden"
          />
        </div>
        <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
          <AlertCircle size={14} />
          Importing will replace all existing data
        </p>
      </Card>

      {/* Onboarding */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <PlayCircle size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">App Tour</h3>
            <p className="text-sm text-slate-400 mb-4">
              View the onboarding slides again to learn about app features
            </p>
            <Button
              onClick={() => {
                setHasSeenOnboarding(false);
                window.location.reload();
              }}
              variant="secondary"
              icon={PlayCircle}
            >
              Show Onboarding
            </Button>
          </div>
        </div>
      </Card>

      {/* Opening Balances */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Calendar size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Opening Balances</h3>
                <p className="text-sm text-slate-400">
                  Set starting balances for months or years to track your financial position
                </p>
              </div>
              <Button onClick={openAddBalanceModal} icon={Plus} size="sm">
                Add Balance
              </Button>
            </div>
            
            {openingBalances.length > 0 ? (
              <div className="space-y-2 mt-4">
                {openingBalances.map((balance) => {
                  const periodLabel = balance.periodType === 'month' 
                    ? new Date(balance.period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : balance.period;
                  return (
                    <div
                      key={balance.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-300">
                            {balance.periodType === 'month' ? 'Month' : 'Year'}: {periodLabel}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                            {balance.currency}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-emerald-400">
                          {formatCurrency(balance.amount, balance.currency)}
                        </p>
                        {balance.notes && (
                          <p className="text-xs text-slate-500 mt-1">{balance.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditBalanceModal(balance)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          aria-label="Edit"
                        >
                          <Edit2 size={16} className="text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteBalance(balance.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar size={40} className="mx-auto mb-2 opacity-50" />
                <p>No opening balances set</p>
                <p className="text-xs mt-1">Add an opening balance to track your starting position</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Opening Balance Modal */}
      <Modal
        isOpen={isOpeningBalanceModalOpen}
        onClose={() => setIsOpeningBalanceModalOpen(false)}
        title={editingBalance ? 'Edit Opening Balance' : 'Add Opening Balance'}
        size="md"
      >
        <form onSubmit={handleSaveBalance} className="space-y-4">
          <Select
            label="Period Type"
            value={balanceForm.periodType}
            onChange={(e) => {
              const periodType = e.target.value;
              const now = new Date();
              let period = '';
              if (periodType === 'month') {
                period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
              } else {
                period = now.getFullYear().toString();
              }
              setBalanceForm({ ...balanceForm, periodType, period });
            }}
          >
            <option value="month">Month</option>
            <option value="year">Year</option>
          </Select>

          {balanceForm.periodType === 'month' ? (
            <Input
              label="Month"
              type="month"
              value={balanceForm.period}
              onChange={(e) => setBalanceForm({ ...balanceForm, period: e.target.value })}
              required
            />
          ) : (
            <Input
              label="Year"
              type="number"
              min="2000"
              max="2100"
              value={balanceForm.period}
              onChange={(e) => setBalanceForm({ ...balanceForm, period: e.target.value })}
              required
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount *"
              type="number"
              step="0.01"
              value={balanceForm.amount}
              onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
              required
            />
            <Select
              label="Currency"
              value={balanceForm.currency}
              onChange={(e) => setBalanceForm({ ...balanceForm, currency: e.target.value })}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Notes (Optional)"
            value={balanceForm.notes}
            onChange={(e) => setBalanceForm({ ...balanceForm, notes: e.target.value })}
            placeholder="e.g., Starting balance for the month"
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingBalance ? 'Update Balance' : 'Add Balance'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpeningBalanceModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Exchange Rates Display */}
      {Object.keys(exchangeRates).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Current Exchange Rates (Base: USD)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {currencies.map((currency) => (
              <div key={currency} className="p-3 rounded-lg bg-white/5">
                <p className="text-sm text-slate-400">{currency}</p>
                <p className="text-lg font-semibold">
                  {exchangeRates[currency]?.toFixed(4) || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

