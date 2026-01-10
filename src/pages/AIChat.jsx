import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useDataStore, useSettingsStore } from '../stores/useStore';
import aiService from '../services/ai/aiService';
import currencyService from '../services/currency/currencyService';

export default function AIChat() {
  const { clients, income, expenses, debts } = useDataStore();
  const { openaiApiKey, baseCurrency } = useSettingsStore();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const messagesEndRef = useRef(null);

  // Prepare comprehensive financial context for AI
  const financialContext = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month data
    const monthlyIncome = income
      .filter((i) => {
        const d = new Date(i.receivedDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + (i.netAmount || i.amount), 0);

    const monthlyExpenses = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    // Last 3 months for trend analysis
    const last3Months = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthIncome = income
        .filter((i) => {
          const d = new Date(i.receivedDate);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, i) => sum + (i.netAmount || i.amount), 0);

      const monthExpenses = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      last3Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses,
      });
    }

    // Client analysis
    const clientSummary = clients.map((c) => {
      const clientIncome = income
        .filter((i) => i.clientId === c.id)
        .reduce((sum, i) => sum + (i.netAmount || i.amount), 0);
      const clientExpenses = expenses
        .filter((e) => e.clientId === c.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        name: c.name,
        totalIncome: clientIncome,
        totalExpenses: clientExpenses,
        profit: clientIncome - clientExpenses,
        paymentModel: c.paymentModel,
        fixedAmount: c.fixedAmount,
        adSpendPercentage: c.adSpendPercentage,
      };
    });

    // Expense analysis by category
    const expensesByCategory = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + e.amount;
    });

    // Payment methods analysis
    const paymentMethods = {};
    income.forEach((i) => {
      const method = i.paymentMethod || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + (i.netAmount || i.amount);
    });

    const pendingDebts = debts.filter((d) => d.status !== 'paid');

    // Calculate metrics
    const profitMargin = monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;

    const avgClientValue = clients.length > 0
      ? clientSummary.reduce((sum, c) => sum + c.totalIncome, 0) / clients.length
      : 0;

    return {
      totalClients: clients.length,
      currentMonthIncome: monthlyIncome,
      currentMonthExpenses: monthlyExpenses,
      netProfit: monthlyIncome - monthlyExpenses,
      profitMargin: profitMargin.toFixed(1),
      clientSummary,
      expensesByCategory,
      paymentMethods,
      pendingDebtsCount: pendingDebts.length,
      pendingDebtsTotal: pendingDebts.reduce((sum, d) => sum + d.amount, 0),
      last3MonthsTrend: last3Months,
      avgClientValue: avgClientValue.toFixed(2),
      currency: baseCurrency,
    };
  }, [clients, income, expenses, debts, baseCurrency]);

  // Historical data for predictions
  const historicalData = useMemo(() => {
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
        .reduce((sum, item) => sum + (item.netAmount || item.amount), 0);

      const monthExpenses = expenses
        .filter((item) => {
          const d = new Date(item.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, item) => sum + item.amount, 0);

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: currencyService.formatCurrency(monthIncome, baseCurrency),
        expenses: currencyService.formatCurrency(monthExpenses, baseCurrency),
      });
    }
    return months;
  }, [income, expenses, baseCurrency]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
  };

  const handleSendMessage = async (customMessage = null) => {
    const messageToSend = customMessage || inputValue.trim();
    if (!messageToSend || !openaiApiKey) return;

    const userMessage = messageToSend;
    if (!customMessage) {
      setInputValue('');
    } else {
      setInputValue(''); // Clear input even for custom messages
    }
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const response = await aiService.answerFinancialQuestion(
        userMessage,
        financialContext,
        openaiApiKey
      );
      addMessage('assistant', response);
    } catch (error) {
      addMessage('assistant', `Error: ${error.message}`);
    }

    setIsLoading(false);
  };

  const handleGetInsights = async () => {
    if (!openaiApiKey) return;

    setActiveFeature('insights');
    setIsLoading(true);
    addMessage('user', 'Generate insights about my finances');

    try {
      const insightsData = {
        totalIncome: currencyService.formatCurrency(
          financialContext.currentMonthIncome,
          baseCurrency
        ),
        totalExpenses: currencyService.formatCurrency(
          financialContext.currentMonthExpenses,
          baseCurrency
        ),
        netProfit: currencyService.formatCurrency(
          financialContext.netProfit,
          baseCurrency
        ),
        profitMargin: financialContext.profitMargin + '%',
        topClients: financialContext.clientSummary
          .sort((a, b) => b.totalIncome - a.totalIncome)
          .slice(0, 5)
          .map(c => ({
            name: c.name,
            income: currencyService.formatCurrency(c.totalIncome, baseCurrency),
            profit: currencyService.formatCurrency(c.profit, baseCurrency),
            paymentModel: c.paymentModel,
          })),
        expensesByCategory: Object.entries(financialContext.expensesByCategory || {})
          .map(([category, amount]) => ({
            category,
            amount: currencyService.formatCurrency(amount, baseCurrency),
          })),
        last3MonthsTrend: financialContext.last3MonthsTrend?.map(m => ({
          month: m.month,
          income: currencyService.formatCurrency(m.income, baseCurrency),
          expenses: currencyService.formatCurrency(m.expenses, baseCurrency),
          profit: currencyService.formatCurrency(m.profit, baseCurrency),
        })) || [],
      };

      const response = await aiService.getInsights(insightsData, openaiApiKey);
      addMessage('assistant', response);
    } catch (error) {
      addMessage('assistant', `Error: ${error.message}`);
    }

    setIsLoading(false);
    setActiveFeature(null);
  };

  const handleGetPredictions = async () => {
    if (!openaiApiKey) return;

    setActiveFeature('predictions');
    setIsLoading(true);
    addMessage('user', 'Predict my next month finances');

    try {
      const response = await aiService.getPredictions(historicalData, openaiApiKey);
      addMessage('assistant', response);
    } catch (error) {
      addMessage('assistant', `Error: ${error.message}`);
    }

    setIsLoading(false);
    setActiveFeature(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!openaiApiKey) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Assistant</h1>
          <p className="text-slate-400 mt-1">
            Get AI-powered insights about your finances
          </p>
        </div>

        <Card className="text-center py-12">
          <AlertCircle size={48} className="mx-auto mb-4 text-amber-400" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            OpenAI API Key Required
          </h3>
          <p className="text-slate-500 mb-4 max-w-md mx-auto">
            To use AI features, please add your OpenAI API key in the Settings page.
          </p>
          <Button onClick={() => (window.location.href = '/settings')}>
            Go to Settings
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">AI Assistant</h1>
        <p className="text-slate-400 mt-1">
          Ask questions about your finances or get AI-powered insights
        </p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleGetInsights}
            variant="secondary"
            icon={Lightbulb}
            loading={activeFeature === 'insights'}
            disabled={isLoading}
          >
            Get Expert Insights
          </Button>
          <Button
            onClick={handleGetPredictions}
            variant="secondary"
            icon={TrendingUp}
            loading={activeFeature === 'predictions'}
            disabled={isLoading}
          >
            Financial Forecast
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSendMessage('How can I improve my profit margin?')}
            disabled={isLoading || !openaiApiKey}
            className="px-3 py-1.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
          >
            Improve Profit Margin
          </button>
          <button
            onClick={() => handleSendMessage('Which client is most profitable and why?')}
            disabled={isLoading || !openaiApiKey}
            className="px-3 py-1.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
          >
            Best Client Analysis
          </button>
          <button
            onClick={() => handleSendMessage('What expenses should I reduce or optimize?')}
            disabled={isLoading || !openaiApiKey}
            className="px-3 py-1.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
          >
            Optimize Expenses
          </button>
          <button
            onClick={() => handleSendMessage('What pricing strategy should I use for new clients?')}
            disabled={isLoading || !openaiApiKey}
            className="px-3 py-1.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
          >
            Pricing Strategy
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden" padding={false}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Sparkles size={48} className="mx-auto mb-4 text-indigo-400 opacity-50" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">
                  Your Expert Financial Advisor
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-4">
                  Ask me anything about your finances. I'll provide expert analysis and recommendations.
                </p>
                <div className="text-sm text-slate-600 space-y-2 max-w-md mx-auto text-left">
                  <p className="font-medium text-slate-400 mb-2">Example questions:</p>
                  <ul className="space-y-1 text-left list-disc list-inside">
                    <li>"How can I improve my profit margin?"</li>
                    <li>"Which client is most profitable?"</li>
                    <li>"Should I renegotiate payment terms with Client X?"</li>
                    <li>"What expenses should I reduce?"</li>
                    <li>"How much should I charge new clients?"</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Bot size={18} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/10 text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-3">
                <Loader2 className="animate-spin text-indigo-400" size={20} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your finances..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              icon={Send}
            >
              Send
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press Enter to send. The AI has access to your financial data summary.
          </p>
        </div>
      </Card>
    </div>
  );
}

