import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Edit2,
  Save,
  X,
  Plus,
  Settings,
  Sparkles,
  Layout,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import WidgetGrid from '../components/dashboard/WidgetGrid';
import AddWidgetModal from '../components/dashboard/AddWidgetModal';
import WidgetSettings from '../components/dashboard/WidgetSettings';
import TemplateSelector from '../components/dashboard/TemplateSelector';

export default function Home() {
  const { user } = useAuthStore();
  const {
    widgets,
    isEditing,
    isLoading,
    loadLayout,
    saveLayout,
    toggleEditMode,
    setEditing,
    updateLayout,
    removeWidget,
    loadWidgetTypes,
  } = useDashboardStore();

  const [showAddWidget, setShowAddWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadLayout();
    loadWidgetTypes();
  }, [loadLayout, loadWidgetTypes]);

  // Reload layout when widgets change externally (e.g., from template)
  useEffect(() => {
    if (!isEditing) {
      loadLayout();
    }
  }, [isEditing, loadLayout]);

  const handleSave = async () => {
    await saveLayout();
    setEditing(false);
  };

  const handleCancel = () => {
    loadLayout(); // Reload to discard changes
    setEditing(false);
  };

  const handleLayoutChange = (updatedWidgets) => {
    updateLayout(updatedWidgets);
  };

  const handleRemove = (widgetId) => {
    removeWidget(widgetId);
  };

  const handleSettings = (widget) => {
    setEditingWidget(widget);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Edit Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Welcome back, {user?.profile?.name || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-xl text-slate-400">
            Manage your finances, track income and expenses, and achieve your financial goals
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" icon={X} onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="outline" icon={Layout} onClick={() => setShowTemplates(true)}>
                Templates
              </Button>
              <Button variant="outline" icon={Sparkles} onClick={() => setShowTemplates(true)}>
                AI Assistant
              </Button>
              <Button variant="primary" icon={Save} onClick={handleSave}>
                Save Layout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" icon={Layout} onClick={() => setShowTemplates(true)}>
                Templates
              </Button>
              <Button variant="outline" icon={Sparkles} onClick={() => setShowTemplates(true)}>
                AI Assistant
              </Button>
              <Button variant="outline" icon={Plus} onClick={() => setShowAddWidget(true)}>
                Add Widget
              </Button>
              <Button variant="primary" icon={Edit2} onClick={toggleEditMode}>
                Customize
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Widget Grid */}
      {widgets.length === 0 && !isEditing ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
          <p className="text-slate-400 mb-4">Your dashboard is empty</p>
          <Button variant="primary" icon={Plus} onClick={() => setShowAddWidget(true)}>
            Add Your First Widget
          </Button>
        </div>
      ) : (
        <div className="w-full">
          <WidgetGrid
            widgets={widgets}
            isEditing={isEditing}
            onLayoutChange={handleLayoutChange}
            onRemove={handleRemove}
            onSettings={handleSettings}
          />
        </div>
      )}

      {/* Modals */}
      <AddWidgetModal isOpen={showAddWidget} onClose={() => setShowAddWidget(false)} />
      <WidgetSettings
        widget={editingWidget}
        isOpen={!!editingWidget}
        onClose={() => setEditingWidget(null)}
      />
      <TemplateSelector isOpen={showTemplates} onClose={() => setShowTemplates(false)} />
    </div>
  );
}
