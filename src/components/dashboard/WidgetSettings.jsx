import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useDashboardStore } from '../../stores/dashboardStore';

export default function WidgetSettings({ widget, isOpen, onClose }) {
  const { updateWidget, saveLayout, availableWidgetTypes } = useDashboardStore();
  const [settings, setSettings] = useState(widget?.settings || {});

  useEffect(() => {
    if (widget) {
      setSettings(widget.settings || {});
    }
  }, [widget]);

  const widgetType = availableWidgetTypes.find((t) => t.id === widget?.type);

  const handleSave = async () => {
    if (!widget) return;
    updateWidget(widget.id, { settings });
    await saveLayout();
    onClose();
  };

  const renderSettingInput = (settingKey, settingDef) => {
    if (settingDef.type === 'select') {
      return (
        <div key={settingKey}>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {settingKey.charAt(0).toUpperCase() + settingKey.slice(1)}
          </label>
          <select
            value={settings[settingKey] || ''}
            onChange={(e) => setSettings({ ...settings, [settingKey]: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {settingDef.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (settingDef.type === 'number') {
      return (
        <div key={settingKey}>
          <Input
            type="number"
            label={settingKey.charAt(0).toUpperCase() + settingKey.slice(1)}
            value={settings[settingKey] || settingDef.default || ''}
            onChange={(e) =>
              setSettings({ ...settings, [settingKey]: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      );
    }

    return null;
  };

  if (!widget || !widgetType) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Widget Settings">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-white mb-2">{widgetType.name}</h3>
          <p className="text-sm text-slate-400">{widgetType.description}</p>
        </div>

        {/* Widget Size Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <h4 className="font-semibold text-white mb-3">Widget Size</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Width (columns)</label>
              <Input
                type="number"
                min="2"
                max="12"
                value={widget.size?.w || 4}
                onChange={(e) => handleSizeChange('w', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Height (rows)</label>
              <Input
                type="number"
                min="2"
                max="8"
                value={widget.size?.h || 3}
                onChange={(e) => handleSizeChange('h', e.target.value)}
              />
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Current size: {widget.size?.w || 4} columns × {widget.size?.h || 3} rows
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Small', w: 3, h: 3 },
              { label: 'Medium', w: 6, h: 4 },
              { label: 'Large', w: 9, h: 5 },
              { label: 'Full', w: 12, h: 4 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={async () => {
                  updateWidget(widget.id, { size: { w: preset.w, h: preset.h } });
                  await saveLayout();
                }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  widget.size?.w === preset.w && widget.size?.h === preset.h
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {widgetType.settings && Object.keys(widgetType.settings).length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <h4 className="font-semibold text-white mb-3">Widget Settings</h4>
            {Object.entries(widgetType.settings).map(([key, def]) =>
              renderSettingInput(key, def)
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={async () => {
            await handleSave();
            await saveLayout();
          }}>
            Save All Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
