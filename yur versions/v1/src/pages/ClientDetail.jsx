import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Star,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import { PrivacyValue } from '../components/ui/PrivacyBlur';
import currencyService from '../services/currency/currencyService';
import aiService from '../services/ai/aiService';

const RISK_LEVELS = [
  { value: 'low', label: 'Low Risk', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { value: 'medium', label: 'Medium Risk', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { value: 'high', label: 'High Risk', color: 'text-red-400', bgColor: 'bg-red-500/20' },
];

const PAYMENT_MODELS = {
  fixed: 'Fixed Salary',
  fixed_plus_percent: 'Fixed + % of Ad Spend',
  percent_only: '% of Ad Spend Only',
  commission: 'Commission (Outsourcing)',
  per_project: 'Per Project',
};

const PAYMENT_METHODS = {
  vodafone_cash: 'Vodafone Cash',
  bank: 'Bank Transfer',
  instapay: 'InstaPay',
  cash: 'Cash',
  other: 'Other',
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, income, updateClient } = useDataStore();
  const { baseCurrency, exchangeRates, privacyMode, setPrivacyMode, openaiApiKey } = useSettingsStore();

  const [isEditingRating, setIsEditingRating] = useState(false);
  const [isEditingRisk, setIsEditingRisk] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [rating, setRating] = useState(3);
  const [riskLevel, setRiskLevel] = useState('medium');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const client = clients.find((c) => c.id === parseInt(id));

  useEffect(() => {
    if (client) {
      setRating(client.rating || 3);
      setRiskLevel(client.riskLevel || 'medium');
      setStatus(client.status || 'active');
      setNotes(client.notes || '');
    }
  }, [client]);

  // Get all income entries for this client
  const clientIncome = useMemo(() => {
    if (!client) return [];
    return income
      .filter((i) => i.clientId === client.id)
      .sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));
  }, [income, client]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!client || clientIncome.length === 0) {
      return {
        totalIncome: 0,
        totalPayments: 0,
        averagePayment: 0,
        lastPaymentDate: null,
        firstPaymentDate: null,
        paymentFrequency: 'N/A',
        totalDeposits: 0,
        depositCount: 0,
      };
    }

    const totalIncome = clientIncome.reduce((sum, i) => {
      const converted = currencyService.convert(
        i.amount,
        i.currency || baseCurrency,
        baseCurrency,
        exchangeRates
      );
      return sum + converted;
    }, 0);

    const deposits = clientIncome.filter((i) => i.isDeposit);
    const totalDeposits = deposits.reduce((sum, i) => {
      const converted = currencyService.convert(
        i.amount,
        i.currency || baseCurrency,
        baseCurrency,
        exchangeRates
      );
      return sum + converted;
    }, 0);

    const dates = clientIncome.map((i) => new Date(i.receivedDate)).sort((a, b) => b - a);
    const firstDate = dates[dates.length - 1];
    const lastDate = dates[0];
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    const paymentFrequency = daysDiff > 0 
      ? `${Math.round(daysDiff / clientIncome.length)} days avg`
      : 'N/A';

    return {
      totalIncome,
      totalPayments: clientIncome.length,
      averagePayment: totalIncome / clientIncome.length,
      lastPaymentDate: lastDate,
      firstPaymentDate: firstDate,
      paymentFrequency,
      totalDeposits,
      depositCount: deposits.length,
    };
  }, [clientIncome, baseCurrency, exchangeRates]);

  const handleSaveRating = async () => {
    if (!client) return;
    try {
      await updateClient(client.id, { rating });
      setIsEditingRating(false);
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const handleSaveRisk = async () => {
    if (!client) return;
    try {
      await updateClient(client.id, { riskLevel });
      setIsEditingRisk(false);
    } catch (error) {
      console.error('Failed to update risk level:', error);
    }
  };

  const handleSaveStatus = async () => {
    if (!client) return;
    try {
      await updateClient(client.id, { status });
      setIsEditingStatus(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!client) return;
    try {
      await updateClient(client.id, { notes });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency) =>
    currencyService.formatCurrency(amount, currency || baseCurrency);

  const getRiskInfo = (level) => RISK_LEVELS.find((r) => r.value === level) || RISK_LEVELS[1];

  // Prepare client data for AI analysis
  const clientDataForAI = useMemo(() => {
    if (!client || !stats) return null;

    const recentPayments = clientIncome.slice(0, 10).map((item) => ({
      date: formatDate(item.receivedDate),
      amount: formatCurrency(
        currencyService.convert(item.amount, item.currency || baseCurrency, baseCurrency, exchangeRates),
        baseCurrency
      ),
      method: PAYMENT_METHODS[item.paymentMethod] || item.paymentMethod,
      projectName: item.projectName,
    }));

    let paymentModelDetails = '';
    if (client.paymentModel === 'fixed' && client.fixedAmount) {
      paymentModelDetails = `Fixed amount: ${formatCurrency(parseFloat(client.fixedAmount), client.currency)}`;
    } else if (client.paymentModel === 'fixed_plus_percent') {
      paymentModelDetails = `Fixed: ${client.fixedAmount ? formatCurrency(parseFloat(client.fixedAmount), client.currency) : 'N/A'}, Plus ${client.adSpendPercentage || 0}% of ad spend`;
    } else if (client.paymentModel === 'percent_only') {
      paymentModelDetails = `${client.adSpendPercentage || 0}% of ad spend only`;
    } else if (client.paymentModel === 'commission') {
      paymentModelDetails = `Commission: ${client.fixedAmount ? formatCurrency(parseFloat(client.fixedAmount), client.currency) : 'N/A'}, Subcontractor cost: ${client.subcontractorCost ? formatCurrency(parseFloat(client.subcontractorCost), client.currency) : 'N/A'}`;
    } else if (client.paymentModel === 'per_project') {
      paymentModelDetails = 'Per project basis - variable amounts';
    }

    return {
      name: client.name,
      paymentModel: PAYMENT_MODELS[client.paymentModel] || client.paymentModel,
      rating: client.rating || 3,
      riskLevel: client.riskLevel || 'medium',
      services: client.services || [],
      currency: client.currency || baseCurrency,
      totalIncome: formatCurrency(stats.totalIncome, baseCurrency),
      totalPayments: stats.totalPayments,
      averagePayment: formatCurrency(stats.averagePayment, baseCurrency),
      firstPaymentDate: formatDate(stats.firstPaymentDate),
      lastPaymentDate: formatDate(stats.lastPaymentDate),
      paymentFrequency: stats.paymentFrequency,
      recentPayments,
      paymentModelDetails,
    };
  }, [client, clientIncome, stats, baseCurrency, exchangeRates]);

  // Generate AI analysis
  const generateAIAnalysis = useCallback(async () => {
    if (!openaiApiKey) {
      setAnalysisError('OpenAI API key is required. Please add it in Settings.');
      return;
    }

    if (!clientDataForAI) return;

    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    try {
      const analysis = await aiService.analyzeClient(clientDataForAI, openaiApiKey);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAnalysisError(error.message || 'Failed to generate AI analysis. Please try again.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [openaiApiKey, clientDataForAI]);

  // Auto-load AI analysis if client has payment history
  useEffect(() => {
    if (client && clientIncome.length > 0 && openaiApiKey && !aiAnalysis && !isLoadingAnalysis && clientDataForAI) {
      // Small delay to let page render first
      const timer = setTimeout(() => {
        generateAIAnalysis();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [client, clientIncome.length, openaiApiKey, aiAnalysis, isLoadingAnalysis, generateAIAnalysis, clientDataForAI]);

  if (!client) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">Client not found</p>
            <Button onClick={() => navigate('/clients')}>Back to Clients</Button>
          </div>
        </Card>
      </div>
    );
  }

  const riskInfo = getRiskInfo(client.riskLevel || 'medium');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/clients">
            <Button variant="secondary" className="flex items-center gap-2">
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{client.name}</h1>
            <p className="text-slate-400 text-sm sm:text-base">{client.email || 'No email'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={generateAIAnalysis}
            disabled={isLoadingAnalysis}
            className="flex items-center gap-2"
          >
            {isLoadingAnalysis ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span className="hidden sm:inline">AI Analysis</span>
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPrivacyMode(!privacyMode)}
            className="flex items-center gap-2"
          >
            {privacyMode ? <Eye size={18} /> : <EyeOff size={18} />}
            <span className="hidden sm:inline">{privacyMode ? 'Show' : 'Hide'} Data</span>
          </Button>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Rating Card */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Rating</span>
            {!isEditingRating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingRating(true)}
                className="p-1"
              >
                <Edit2 size={14} />
              </Button>
            )}
          </div>
          {isEditingRating ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={24}
                      className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
                    />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveRating} className="flex-1">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setRating(client.rating || 3);
                    setIsEditingRating(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={star <= (client.rating || 3) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
                />
              ))}
              <span className="text-lg font-semibold text-white ml-2">
                {client.rating || 3}/5
              </span>
            </div>
          )}
        </Card>

        {/* Risk Level Card */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Risk Level</span>
            {!isEditingRisk && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingRisk(true)}
                className="p-1"
              >
                <Edit2 size={14} />
              </Button>
            )}
          </div>
          {isEditingRisk ? (
            <div className="space-y-2">
              <Select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full"
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveRisk} className="flex-1">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setRiskLevel(client.riskLevel || 'medium');
                    setIsEditingRisk(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${riskInfo.bgColor}`}>
              <AlertTriangle size={16} className={riskInfo.color} />
              <span className={`text-sm font-medium ${riskInfo.color}`}>
                {riskInfo.label}
              </span>
            </div>
          )}
        </Card>

        {/* Status Card */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Status</span>
            {!isEditingStatus && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingStatus(true)}
                className="p-1"
              >
                <Edit2 size={14} />
              </Button>
            )}
          </div>
          {isEditingStatus ? (
            <div className="space-y-2">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full"
              >
                <option value="active">Active</option>
                <option value="hold">On Hold</option>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveStatus} className="flex-1">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setStatus(client.status || 'active');
                    setIsEditingStatus(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              (client.status || 'active') === 'active'
                ? 'bg-emerald-500/20 border border-emerald-500/30'
                : 'bg-amber-500/20 border border-amber-500/30'
            }`}>
              <CheckCircle 
                size={16} 
                className={(client.status || 'active') === 'active' ? 'text-emerald-400' : 'text-amber-400'} 
              />
              <span className={`text-sm font-medium ${
                (client.status || 'active') === 'active' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {(client.status || 'active') === 'active' ? 'Active' : 'On Hold'}
              </span>
            </div>
          )}
        </Card>

        {/* Payment Model Card */}
        <Card>
          <span className="text-sm text-slate-400 block mb-2">Payment Model</span>
          <p className="text-white font-semibold">
            {PAYMENT_MODELS[client.paymentModel] || client.paymentModel}
          </p>
          {client.paymentModel === 'fixed' && client.fixedAmount && (
            <p className="text-sm text-slate-400 mt-1">
              <PrivacyValue value={formatCurrency(parseFloat(client.fixedAmount), client.currency)} />
            </p>
          )}
          {client.paymentModel === 'fixed_plus_percent' && (
            <p className="text-sm text-slate-400 mt-1">
              {client.fixedAmount && (
                <>
                  Fixed: <PrivacyValue value={formatCurrency(parseFloat(client.fixedAmount), client.currency)} />
                  {' + '}
                </>
              )}
              {client.adSpendPercentage}% of Ad Spend
            </p>
          )}
          {client.paymentModel === 'percent_only' && client.adSpendPercentage && (
            <p className="text-sm text-slate-400 mt-1">
              {client.adSpendPercentage}% of Ad Spend
            </p>
          )}
        </Card>

        {/* Services Card */}
        <Card>
          <span className="text-sm text-slate-400 block mb-2">Services</span>
          <div className="flex flex-wrap gap-2">
            {client.services && client.services.length > 0 ? (
              client.services.map((service, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                >
                  {service}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-sm">No services listed</span>
            )}
          </div>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Income</p>
              <p className="text-xl font-bold text-white">
                <PrivacyValue value={formatCurrency(stats.totalIncome, baseCurrency)} />
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <CreditCard className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Payments</p>
              <p className="text-xl font-bold text-white">{stats.totalPayments}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Average Payment</p>
              <p className="text-xl font-bold text-white">
                <PrivacyValue value={formatCurrency(stats.averagePayment, baseCurrency)} />
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Calendar className="text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Last Payment</p>
              <p className="text-xl font-bold text-white">
                {formatDate(stats.lastPaymentDate)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Deposit Statistics (if any deposits) */}
      {stats.depositCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <DollarSign className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Deposits</p>
                <p className="text-xl font-bold text-white">
                  <PrivacyValue value={formatCurrency(stats.totalDeposits, baseCurrency)} />
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <CreditCard className="text-cyan-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Deposit Payments</p>
                <p className="text-xl font-bold text-white">{stats.depositCount}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI Analysis Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            AI Client Analysis
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={generateAIAnalysis}
            disabled={isLoadingAnalysis}
          >
            {isLoadingAnalysis ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              'Refresh Analysis'
            )}
          </Button>
        </div>

        {isLoadingAnalysis && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-purple-400 mx-auto mb-4" />
              <p className="text-slate-400">AI is analyzing client data...</p>
            </div>
          </div>
        )}

        {analysisError && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{analysisError}</p>
            {!openaiApiKey && (
              <Link to="/settings">
                <Button variant="secondary" size="sm" className="mt-2">
                  Go to Settings
                </Button>
              </Link>
            )}
          </div>
        )}

        {aiAnalysis && !isLoadingAnalysis && (
          <div className="prose prose-invert max-w-none">
            <div
              className="text-slate-300 whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: aiAnalysis
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em class="text-slate-400">$1</em>')
                  .replace(/### (.*?)\n/g, '<h3 class="text-white font-semibold text-lg mt-6 mb-3">$1</h3>')
                  .replace(/## (.*?)\n/g, '<h2 class="text-white font-bold text-xl mt-8 mb-4">$1</h2>')
                  .replace(/\n\n/g, '<br/><br/>')
                  .replace(/\n/g, '<br/>'),
              }}
            />
          </div>
        )}

        {!aiAnalysis && !isLoadingAnalysis && !analysisError && (
          <div className="text-center py-8">
            <Sparkles size={48} className="mx-auto mb-4 text-purple-400/50" />
            <p className="text-slate-400 mb-4">
              Get AI-powered insights about this client
            </p>
            <Button onClick={generateAIAnalysis} className="flex items-center gap-2 mx-auto">
              <Sparkles size={18} />
              Generate AI Analysis
            </Button>
          </div>
        )}
      </Card>

      {/* Notes Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={20} />
            Notes
          </h2>
          <Button size="sm" onClick={handleSaveNotes}>
            Save Notes
          </Button>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this client..."
          rows={4}
        />
      </Card>

      {/* Payment History */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={20} />
          Payment History
        </h2>
        {clientIncome.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No payment history yet</p>
            <Link to="/income">
              <Button variant="secondary" className="mt-4">
                Add Income Entry
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Net Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {clientIncome.map((item) => {
                  const netAmount = item.netAmount || item.amount;
                  const convertedAmount = currencyService.convert(
                    item.amount,
                    item.currency || baseCurrency,
                    baseCurrency,
                    exchangeRates
                  );
                  const convertedNet = currencyService.convert(
                    netAmount,
                    item.currency || baseCurrency,
                    baseCurrency,
                    exchangeRates
                  );
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-slate-300">
                        {formatDate(item.receivedDate)}
                      </td>
                      <td className="py-3 px-4 text-sm text-white font-medium">
                        <PrivacyValue value={formatCurrency(convertedAmount, baseCurrency)} />
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-300">
                        <PrivacyValue value={formatCurrency(convertedNet, baseCurrency)} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-700/50 text-slate-300">
                          <CreditCard size={12} />
                          {PAYMENT_METHODS[item.paymentMethod] || item.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {item.projectName || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-green-400">
                            <CheckCircle size={14} />
                            <span className="text-xs">Paid</span>
                          </span>
                          {item.isDeposit && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {item.isFixedPortionOnly ? 'Fixed Deposit' : 'Deposit'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

