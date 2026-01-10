import { useState } from 'react';
import { Sparkles, Layout, TrendingUp, Minimize2, Grid, Wand2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { dashboardTemplates, applyTemplate } from '../../services/dashboardTemplates';
import { useDashboardStore } from '../../stores/dashboardStore';
import aiService from '../../services/api/ai';
import { useDataStore } from '../../stores/useStore';
import AIBuilder from './AIBuilder';

const templateIcons = {
  financial: TrendingUp,
  sales: Layout,
  minimal: Minimize2,
  comprehensive: Grid,
};

export default function TemplateSelector({ isOpen, onClose }) {
  const { widgets, updateLayout, saveLayout, setEditing, loadLayout } = useDashboardStore();
  const { clients, income, expenses, goals, invoices } = useDataStore();
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);

  const handleApplyTemplate = async (templateKey) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const template = applyTemplate(templateKey);
      if (template && template.widgets && template.widgets.length > 0) {
        console.log('Applying template:', templateKey, 'with', template.widgets.length, 'widgets');
        
        // Update the layout with new widgets
        updateLayout(template.widgets);
        
        // Save to backend
        const saved = await saveLayout();
        console.log('Template saved:', saved);
        
        // Reload layout from backend to ensure sync
        await loadLayout();
        
        // Enable editing mode so user can see and adjust
        setEditing(true);
        
        // Close modal
        onClose();
      } else {
        console.error('Template not found or invalid:', templateKey, template);
        alert('Template not found or has no widgets. Please try again.');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      alert(`Failed to apply template: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
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

      const suggestions = await aiService.generateDashboardSuggestions(userData);
      setAiSuggestions(suggestions);
      setShowAISuggestions(true);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAISuggestions = async () => {
    if (!aiSuggestions?.suggestions) return;

    setLoading(true);
    try {
      const newWidgets = [];
      let x = 0;
      let y = 0;

      // Sort suggestions by priority
      const sorted = [...aiSuggestions.suggestions].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      sorted.forEach((suggestion, index) => {
        const widget = {
          id: `ai-widget-${Date.now()}-${index}`,
          type: suggestion.type,
          position: { x, y },
          size: suggestion.type === 'chart' || suggestion.type === 'trends' 
            ? { w: 8, h: 4 }
            : suggestion.type === 'stat-card'
            ? { w: 3, h: 3 }
            : { w: 6, h: 4 },
          settings: suggestion.settings || {},
          isVisible: true,
        };

        newWidgets.push(widget);

        // Update position for next widget
        x += widget.size.w;
        if (x >= 12) {
          x = 0;
          y += widget.size.h;
        }
      });

      updateLayout(newWidgets);
      await saveLayout();
      setEditing(false);
      onClose();
    } catch (error) {
      console.error('Error applying AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const userData = {
        hasIncome: income.length > 0,
        hasExpenses: expenses.length > 0,
        hasClients: clients.length > 0,
        hasGoals: goals.length > 0,
        hasInvoices: invoices.length > 0,
      };

      const optimized = await aiService.optimizeDashboardLayout(
        { widgets },
        userData
      );

      if (optimized?.widgets) {
        updateLayout(optimized.widgets);
        await saveLayout();
      }
      onClose();
    } catch (error) {
      console.error('Error optimizing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dashboard Templates & AI">
      <div className="space-y-6">
        {/* AI Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="primary"
              className="w-full"
              icon={Wand2}
              onClick={() => setShowAIBuilder(true)}
              disabled={loading}
            >
              AI Builder
            </Button>
            
            {widgets.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                icon={Sparkles}
                onClick={handleOptimize}
                disabled={loading}
              >
                {loading ? 'Optimizing...' : 'Optimize Current'}
              </Button>
            )}
          </div>

          {showAISuggestions && aiSuggestions && (
            <Card className="border-indigo-500/30 bg-indigo-500/10">
              <h4 className="font-semibold text-white mb-3">AI Suggestions</h4>
              <div className="space-y-2 mb-4">
                {aiSuggestions.suggestions?.slice(0, 5).map((suggestion, index) => (
                  <div key={index} className="text-sm text-slate-300">
                    <span className="font-medium capitalize">{suggestion.type.replace('-', ' ')}:</span>{' '}
                    {suggestion.reason}
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyAISuggestions}
                disabled={loading}
              >
                Apply AI Suggestions
              </Button>
            </Card>
          )}
        </div>

        {/* AI Builder Modal */}
        <AIBuilder isOpen={showAIBuilder} onClose={() => setShowAIBuilder(false)} />

        {/* Templates Section */}
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Pre-built Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(dashboardTemplates).map(([key, template]) => {
              const Icon = templateIcons[key] || Layout;
              return (
                <Card
                  key={key}
                  className="hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                      <p className="text-sm text-slate-400 mb-2">{template.description}</p>
                      <div className="text-xs text-slate-500 mb-3">
                        {template.widgets.length} widgets
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApplyTemplate(key)}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Applying...' : 'Apply Template'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
