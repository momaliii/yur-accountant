// Default dashboard templates
export const dashboardTemplates = {
  financial: {
    name: 'Financial Overview',
    description: 'Complete financial dashboard with income, expenses, and trends',
    widgets: [
      {
        id: 'stat-income',
        type: 'stat-card',
        position: { x: 0, y: 0 },
        size: { w: 3, h: 3 },
        settings: { statType: 'income' },
        isVisible: true,
      },
      {
        id: 'stat-expenses',
        type: 'stat-card',
        position: { x: 3, y: 0 },
        size: { w: 3, h: 3 },
        settings: { statType: 'expenses' },
        isVisible: true,
      },
      {
        id: 'stat-clients',
        type: 'stat-card',
        position: { x: 6, y: 0 },
        size: { w: 3, h: 3 },
        settings: { statType: 'clients' },
        isVisible: true,
      },
      {
        id: 'stat-goals',
        type: 'stat-card',
        position: { x: 9, y: 0 },
        size: { w: 3, h: 3 },
        settings: { statType: 'goals' },
        isVisible: true,
      },
      {
        id: 'chart-main',
        type: 'chart',
        position: { x: 0, y: 3 },
        size: { w: 8, h: 4 },
        settings: { chartType: 'line', period: 'month' },
        isVisible: true,
      },
      {
        id: 'recent-activity',
        type: 'recent-activity',
        position: { x: 8, y: 3 },
        size: { w: 4, h: 4 },
        settings: { limit: 10 },
        isVisible: true,
      },
      {
        id: 'trends',
        type: 'trends',
        position: { x: 0, y: 7 },
        size: { w: 6, h: 4 },
        settings: {},
        isVisible: true,
      },
      {
        id: 'goals-widget',
        type: 'goals',
        position: { x: 6, y: 7 },
        size: { w: 6, h: 4 },
        settings: {},
        isVisible: true,
      },
    ],
  },
  
  sales: {
    name: 'Sales Focus',
    description: 'Optimized for tracking sales and client relationships',
    widgets: [
      {
        id: 'stat-income',
        type: 'stat-card',
        position: { x: 0, y: 0 },
        size: { w: 4, h: 3 },
        settings: { statType: 'income' },
        isVisible: true,
      },
      {
        id: 'stat-clients',
        type: 'stat-card',
        position: { x: 4, y: 0 },
        size: { w: 4, h: 3 },
        settings: { statType: 'clients' },
        isVisible: true,
      },
      {
        id: 'clients-top',
        type: 'clients',
        position: { x: 0, y: 3 },
        size: { w: 6, h: 4 },
        settings: { limit: 5 },
        isVisible: true,
      },
      {
        id: 'chart-sales',
        type: 'chart',
        position: { x: 6, y: 3 },
        size: { w: 6, h: 4 },
        settings: { chartType: 'bar', period: 'month' },
        isVisible: true,
      },
      {
        id: 'quick-actions',
        type: 'quick-actions',
        position: { x: 0, y: 7 },
        size: { w: 6, h: 3 },
        settings: {},
        isVisible: true,
      },
      {
        id: 'recent-activity',
        type: 'recent-activity',
        position: { x: 6, y: 7 },
        size: { w: 6, h: 3 },
        settings: { limit: 8 },
        isVisible: true,
      },
    ],
  },
  
  minimal: {
    name: 'Minimal',
    description: 'Clean and simple dashboard with essential widgets',
    widgets: [
      {
        id: 'stat-income',
        type: 'stat-card',
        position: { x: 0, y: 0 },
        size: { w: 4, h: 3 },
        settings: { statType: 'income' },
        isVisible: true,
      },
      {
        id: 'stat-expenses',
        type: 'stat-card',
        position: { x: 4, y: 0 },
        size: { w: 4, h: 3 },
        settings: { statType: 'expenses' },
        isVisible: true,
      },
      {
        id: 'chart-simple',
        type: 'chart',
        position: { x: 0, y: 3 },
        size: { w: 8, h: 4 },
        settings: { chartType: 'area', period: 'month' },
        isVisible: true,
      },
      {
        id: 'quick-actions',
        type: 'quick-actions',
        position: { x: 8, y: 3 },
        size: { w: 4, h: 4 },
        settings: {},
        isVisible: true,
      },
    ],
  },
  
  comprehensive: {
    name: 'Comprehensive',
    description: 'Full-featured dashboard with all available widgets',
    widgets: [
      {
        id: 'stat-income',
        type: 'stat-card',
        position: { x: 0, y: 0 },
        size: { w: 3, h: 3 },
        settings: { statType: 'income' },
        isVisible: true,
      },
      {
        id: 'stat-expenses',
        type: 'stat-card',
        position: { x: 3, y: 0 },
        size: { w: 3, h: 3 },
        settings: { statType: 'expenses' },
        isVisible: true,
      },
      {
        id: 'stat-clients',
        type: 'stat-card',
        position: { x: 6, y: 0 },
        size: { w: 3, h: 3 },
        settings: { statType: 'clients' },
        isVisible: true,
      },
      {
        id: 'stat-goals',
        type: 'stat-card',
        position: { x: 9, y: 0 },
        size: { w: 3, h: 3 },
        settings: { statType: 'goals' },
        isVisible: true,
      },
      {
        id: 'chart-main',
        type: 'chart',
        position: { x: 0, y: 3 },
        size: { w: 6, h: 4 },
        settings: { chartType: 'line', period: 'month' },
        isVisible: true,
      },
      {
        id: 'trends',
        type: 'trends',
        position: { x: 6, y: 3 },
        size: { w: 6, h: 4 },
        settings: {},
        isVisible: true,
      },
      {
        id: 'clients-top',
        type: 'clients',
        position: { x: 0, y: 7 },
        size: { w: 4, h: 4 },
        settings: { limit: 5 },
        isVisible: true,
      },
      {
        id: 'goals-widget',
        type: 'goals',
        position: { x: 4, y: 7 },
        size: { w: 4, h: 4 },
        settings: {},
        isVisible: true,
      },
      {
        id: 'calendar',
        type: 'calendar',
        position: { x: 8, y: 7 },
        size: { w: 4, h: 4 },
        settings: {},
        isVisible: true,
      },
      {
        id: 'recent-activity',
        type: 'recent-activity',
        position: { x: 0, y: 11 },
        size: { w: 6, h: 4 },
        settings: { limit: 10 },
        isVisible: true,
      },
      {
        id: 'quick-actions',
        type: 'quick-actions',
        position: { x: 6, y: 11 },
        size: { w: 6, h: 4 },
        settings: {},
        isVisible: true,
      },
    ],
  },
};

// Generate unique IDs for template widgets
export function applyTemplate(templateKey) {
  const template = dashboardTemplates[templateKey];
  if (!template) {
    console.error('Template not found:', templateKey);
    return null;
  }
  
  if (!template.widgets || template.widgets.length === 0) {
    console.error('Template has no widgets:', templateKey);
    return null;
  }
  
  const timestamp = Date.now();
  const widgets = template.widgets.map((widget, index) => ({
    ...widget,
    id: `widget-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
  }));
  
  console.log('Applied template:', templateKey, 'generated', widgets.length, 'widgets');
  
  return {
    ...template,
    widgets,
  };
}

export default dashboardTemplates;
