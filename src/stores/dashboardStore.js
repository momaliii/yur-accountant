import { create } from 'zustand';
import dashboardService from '../services/api/dashboard';

export const useDashboardStore = create((set, get) => ({
  widgets: [],
  layout: {},
  isEditing: false,
  isLoading: false,
  availableWidgetTypes: [],

  // Load dashboard layout
  loadLayout: async () => {
    set({ isLoading: true });
    try {
      const layout = await dashboardService.getLayout();
      set({
        widgets: layout.widgets || [],
        layout: layout.layout || {},
        isLoading: false,
      });
    } catch (error) {
      // Silently ignore 404 errors (route not implemented yet)
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        set({ widgets: [], layout: {}, isLoading: false });
        return;
      }
      console.error('Error loading dashboard layout:', error);
      set({ isLoading: false });
    }
  },

  // Save dashboard layout
  saveLayout: async () => {
    const { widgets, layout } = get();
    try {
      const savedLayout = await dashboardService.saveLayout({ widgets, layout });
      const updatedWidgets = savedLayout.widgets || widgets;
      const updatedLayout = savedLayout.layout || layout;
      set({
        widgets: updatedWidgets,
        layout: updatedLayout,
      });
      console.log('Layout saved successfully:', updatedWidgets.length, 'widgets');
      return savedLayout;
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      throw error;
    }
  },

  // Load available widget types
  loadWidgetTypes: async () => {
    try {
      const types = await dashboardService.getWidgetTypes();
      set({ availableWidgetTypes: types });
    } catch (error) {
      // Silently ignore 404 errors (route not implemented yet)
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        set({ availableWidgetTypes: [] });
        return;
      }
      console.error('Error loading widget types:', error);
    }
  },

  // Add widget
  addWidget: (widgetType, settings = {}) => {
    const { widgets } = get();
    const newWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: widgetType,
      position: { x: 0, y: 0 },
      size: { w: 4, h: 3 },
      settings,
      isVisible: true,
    };
    set({ widgets: [...widgets, newWidget] });
    return newWidget;
  },

  // Remove widget
  removeWidget: (widgetId) => {
    const { widgets } = get();
    set({ widgets: widgets.filter((w) => w.id !== widgetId) });
  },

  // Update widget
  updateWidget: (widgetId, updates) => {
    const { widgets } = get();
    set({
      widgets: widgets.map((w) =>
        w.id === widgetId ? { ...w, ...updates } : w
      ),
    });
  },

  // Update layout (from drag-and-drop)
  updateLayout: (updatedWidgets) => {
    set({ widgets: updatedWidgets });
  },

  // Toggle edit mode
  toggleEditMode: () => {
    const { isEditing } = get();
    set({ isEditing: !isEditing });
  },

  // Set editing mode
  setEditing: (editing) => {
    set({ isEditing: editing });
  },
}));
