import { useState } from 'react';
import { Sparkles, Wand2, CheckCircle, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { useDashboardStore } from '../../stores/dashboardStore';
import aiService from '../../services/api/ai';
import { useDataStore } from '../../stores/useStore';

export default function AIBuilder({ isOpen, onClose }) {
  const { widgets, updateLayout, saveLayout, setEditing, loadLayout } = useDashboardStore();
  const { clients, income, expenses, goals, invoices, debts, savings } = useDataStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('input'); // 'input', 'suggestions', 'preview'
  const [userPrompt, setUserPrompt] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [customizing, setCustomizing] = useState(false);

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      alert('Please describe what you want in your dashboard');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        hasIncome: income.length > 0,
        hasExpenses: expenses.length > 0,
        hasClients: clients.length > 0,
        hasGoals: goals.length > 0,
        hasInvoices: invoices.length > 0,
        hasDebts: debts.length > 0,
        hasSavings: savings.length > 0,
        incomeCount: income.length,
        expenseCount: expenses.length,
        clientCount: clients.length,
        goalCount: goals.length,
        invoiceCount: invoices.length,
        prompt: userPrompt,
      };

      const result = await aiService.generateDashboardSuggestions(userData);
      setSuggestions(result);
      setStep('suggestions');
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleWidget = (widgetType) => {
    setSelectedWidgets((prev) => {
      if (prev.includes(widgetType)) {
        return prev.filter((w) => w !== widgetType);
      }
      return [...prev, widgetType];
    });
  };

  const handleApplySuggestions = async () => {
    if (selectedWidgets.length === 0) {
      alert('Please select at least one widget');
      return;
    }

    setLoading(true);
    try {
      const newWidgets = [];
      let x = 0;
      let y = 0;
      const maxWidth = 12;

      // Create widgets from selected suggestions
      const widgetMap = {
        'stat-card-income': { type: 'stat-card', settings: { statType: 'income' }, size: { w: 3, h: 3 } },
        'stat-card-expenses': { type: 'stat-card', settings: { statType: 'expenses' }, size: { w: 3, h: 3 } },
        'stat-card-clients': { type: 'stat-card', settings: { statType: 'clients' }, size: { w: 3, h: 3 } },
        'stat-card-goals': { type: 'stat-card', settings: { statType: 'goals' }, size: { w: 3, h: 3 } },
        'chart': { type: 'chart', settings: { chartType: 'line', period: 'month' }, size: { w: 8, h: 4 } },
        'trends': { type: 'trends', settings: {}, size: { w: 8, h: 4 } },
        'clients': { type: 'clients', settings: { limit: 5 }, size: { w: 6, h: 4 } },
        'goals': { type: 'goals', settings: {}, size: { w: 6, h: 4 } },
        'calendar': { type: 'calendar', settings: {}, size: { w: 6, h: 5 } },
        'recent-activity': { type: 'recent-activity', settings: { limit: 10 }, size: { w: 6, h: 4 } },
        'quick-actions': { type: 'quick-actions', settings: {}, size: { w: 6, h: 3 } },
      };

      selectedWidgets.forEach((widgetType, index) => {
        const config = widgetMap[widgetType] || widgetMap[widgetType.replace('stat-card-', 'stat-card-')];
        if (config) {
          const widget = {
            id: `ai-widget-${Date.now()}-${index}`,
            type: config.type,
            position: { x, y },
            size: config.size,
            settings: config.settings || {},
            isVisible: true,
          };

          newWidgets.push(widget);

          x += widget.size.w;
          if (x >= maxWidth) {
            x = 0;
            y += widget.size.h;
          }
        }
      });

      updateLayout(newWidgets);
      await saveLayout();
      await loadLayout();
      setEditing(true);
      onClose();
    } catch (error) {
      console.error('Error applying suggestions:', error);
      alert('Failed to apply dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartGenerate = async () => {
    setLoading(true);
    try {
      const userData = {
        hasIncome: income.length > 0,
        hasExpenses: expenses.length > 0,
        hasClients: clients.length > 0,
        hasGoals: goals.length > 0,
        hasInvoices: invoices.length > 0,
        incomeCount: income.length,
        expenseCount: expenses.length,
        clientCount: clients.length,
        goalCount: goals.length,
      };

      const result = await aiService.generateDashboardSuggestions(userData);
      
      // Auto-select high priority widgets
      const highPriority = result.suggestions
        ?.filter((s) => s.priority === 'high')
        .map((s) => {
          if (s.type === 'stat-card') {
            return `stat-card-${s.settings?.statType || 'income'}`;
          }
          return s.type;
        }) || [];

      setSelectedWidgets(highPriority);
      setSuggestions(result);
      setStep('suggestions');
    } catch (error) {
      console.error('Error generating smart dashboard:', error);
      alert('Failed to generate dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const widgetLabels = {
    'stat-card-income': 'Income Stat',
    'stat-card-expenses': 'Expenses Stat',
    'stat-card-clients': 'Clients Stat',
    'stat-card-goals': 'Goals Stat',
    'chart': 'Income vs Expenses Chart',
    'trends': 'Monthly Trends',
    'clients': 'Top Clients',
    'goals': 'Goals Progress',
    'calendar': 'Upcoming Deadlines',
    'recent-activity': 'Recent Activity',
    'quick-actions': 'Quick Actions',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Dashboard Builder" size="lg">
      <div className="space-y-6">
        {step === 'input' && (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Describe Your Dashboard</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Tell us what you want to see, or let AI create an optimal dashboard for you
                </p>
                <Input
                  type="text"
                  placeholder="e.g., 'Show me income, expenses, and top clients' or 'Create a sales-focused dashboard'"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  className="w-full"
                  icon={Sparkles}
                  onClick={handleGenerate}
                  disabled={loading || !userPrompt.trim()}
                >
                  {loading ? 'Generating...' : 'Generate from Description'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  icon={Wand2}
                  onClick={handleSmartGenerate}
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Smart Generate (Auto)'}
                </Button>
              </div>
            </div>

            <Card className="bg-indigo-500/10 border-indigo-500/30">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">AI Suggestions</h4>
                  <p className="text-sm text-slate-300">
                    Based on your data, we recommend widgets for:
                    {income.length > 0 && ' Income tracking'}
                    {expenses.length > 0 && ' Expense monitoring'}
                    {clients.length > 0 && ' Client management'}
                    {goals.length > 0 && ' Goal tracking'}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {step === 'suggestions' && suggestions && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Select Widgets</h3>
                <p className="text-sm text-slate-400">Choose the widgets you want in your dashboard</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('input')}>
                Back
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {suggestions.suggestions?.map((suggestion, index) => {
                const widgetKey = suggestion.type === 'stat-card'
                  ? `stat-card-${suggestion.settings?.statType || 'income'}`
                  : suggestion.type;
                const isSelected = selectedWidgets.includes(widgetKey);
                const label = widgetLabels[widgetKey] || suggestion.type;

                return (
                  <div
                    key={index}
                    onClick={() => toggleWidget(widgetKey)}
                    className={`
                      rounded-2xl glass p-4 cursor-pointer transition-all
                      border-2 select-none
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-500/20 hover:bg-indigo-500/30'
                        : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                      }
                    `}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleWidget(widgetKey);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                          pointer-events-none transition-all
                          ${isSelected
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-slate-600'
                          }
                        `}
                      >
                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">{label}</div>
                        <div className="text-xs text-slate-400 mt-1">{suggestion.reason}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Priority: <span className="capitalize">{suggestion.priority}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-700">
              <Button variant="ghost" onClick={() => setStep('input')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApplySuggestions}
                disabled={loading || selectedWidgets.length === 0}
                className="flex-1"
              >
                {loading ? 'Creating...' : `Create Dashboard (${selectedWidgets.length} widgets)`}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
