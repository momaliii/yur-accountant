import { useMemo, useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import StatWidget from './widgets/StatWidget';
import ChartWidget from './widgets/ChartWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';
import GoalsWidget from './widgets/GoalsWidget';
import ClientsWidget from './widgets/ClientsWidget';
import CalendarWidget from './widgets/CalendarWidget';
import TrendsWidget from './widgets/TrendsWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const widgetComponents = {
  'stat-card': StatWidget,
  'chart': ChartWidget,
  'quick-actions': QuickActionsWidget,
  'recent-activity': RecentActivityWidget,
  'goals': GoalsWidget,
  'clients': ClientsWidget,
  'calendar': CalendarWidget,
  'trends': TrendsWidget,
};

export default function WidgetGrid({ widgets, isEditing, onLayoutChange, onRemove, onSettings }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const layout = useMemo(() => {
    return widgets.map((widget) => ({
      i: widget.id,
      x: widget.position?.x || 0,
      y: widget.position?.y || 0,
      w: widget.size?.w || 4,
      h: widget.size?.h || 3,
      minW: widget.size?.minW || 2,
      minH: widget.size?.minH || 2,
      maxW: widget.size?.maxW || 12,
      maxH: widget.size?.maxH || 8,
    }));
  }, [widgets]);

  const handleLayoutChange = (currentLayout, allLayouts) => {
    if (onLayoutChange && currentLayout) {
      const updatedWidgets = widgets.map((widget) => {
        const layoutItem = currentLayout.find((item) => item.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            position: { x: layoutItem.x, y: layoutItem.y },
            size: { w: layoutItem.w, h: layoutItem.h },
          };
        }
        return widget;
      });
      onLayoutChange(updatedWidgets);
    }
  };

  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget) => {
          const WidgetComponent = widgetComponents[widget.type];
          if (!WidgetComponent) return null;
          return (
            <div key={widget.id} className="widget-item">
              <WidgetComponent
                widget={widget}
                isEditing={isEditing}
                onRemove={onRemove}
                onSettings={onSettings}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={60}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's']}
      >
        {widgets.map((widget) => {
          const WidgetComponent = widgetComponents[widget.type];
          if (!WidgetComponent) return null;

          return (
            <div key={widget.id} className="widget-item">
              {isEditing && (
                <div className="drag-handle absolute top-2 left-2 z-10 cursor-move p-1.5 bg-slate-700/90 rounded-md text-slate-300 hover:text-white hover:bg-slate-600 transition-colors shadow-lg">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
                    <circle cx="2" cy="2" r="1" />
                    <circle cx="6" cy="2" r="1" />
                    <circle cx="10" cy="2" r="1" />
                    <circle cx="2" cy="6" r="1" />
                    <circle cx="6" cy="6" r="1" />
                    <circle cx="10" cy="6" r="1" />
                    <circle cx="2" cy="10" r="1" />
                    <circle cx="6" cy="10" r="1" />
                    <circle cx="10" cy="10" r="1" />
                  </svg>
                </div>
              )}
              <WidgetComponent
                widget={widget}
                isEditing={isEditing}
                onRemove={onRemove}
                onSettings={onSettings}
              />
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
