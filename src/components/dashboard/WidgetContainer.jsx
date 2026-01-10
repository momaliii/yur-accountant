import { useState } from 'react';
import { X, Settings, Maximize2, Minimize2 } from 'lucide-react';
import Card from '../ui/Card';
import { useDashboardStore } from '../../stores/dashboardStore';

export default function WidgetContainer({ 
  widget, 
  isEditing, 
  onRemove, 
  onSettings, 
  children 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { updateWidget, saveLayout } = useDashboardStore();

  const handleResize = async (size) => {
    updateWidget(widget.id, { size: { ...widget.size, ...size } });
    // Auto-save on resize
    setTimeout(() => saveLayout(), 500);
  };

  const presetSizes = [
    { label: 'Small', w: 3, h: 3 },
    { label: 'Medium', w: 6, h: 4 },
    { label: 'Large', w: 9, h: 5 },
    { label: 'Full Width', w: 12, h: 4 },
    { label: 'Tall', w: 4, h: 6 },
    { label: 'Wide', w: 8, h: 3 },
  ];

  return (
    <div
      className="relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing && (
        <>
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            {onSettings && (
              <button
                onClick={() => onSettings(widget)}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors shadow-lg"
                title="Settings"
              >
                <Settings size={14} />
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(widget.id)}
                className="p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors shadow-lg"
                title="Remove"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Size Presets Dropdown */}
          {isHovered && (
            <div className="absolute top-2 left-12 z-20">
              <div className="relative group">
                <button
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors shadow-lg"
                  title="Resize"
                >
                  <Maximize2 size={14} />
                </button>
                <div className="absolute top-full left-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-slate-400 mb-2 px-2">Quick Resize</div>
                    <div className="space-y-1">
                      {presetSizes.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => handleResize({ w: preset.w, h: preset.h })}
                          className="w-full text-left px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors"
                        >
                          {preset.label} ({preset.w}×{preset.h})
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-700 mt-2 pt-2">
                      <div className="text-xs text-slate-400 px-2 mb-1">Current: {widget.size?.w || 4}×{widget.size?.h || 3}</div>
                      <div className="text-xs text-slate-500 px-2">Drag corner to resize</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <Card className="h-full">
        {children}
      </Card>
    </div>
  );
}
