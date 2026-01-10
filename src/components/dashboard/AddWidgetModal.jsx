import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useDashboardStore } from '../../stores/dashboardStore';

export default function AddWidgetModal({ isOpen, onClose }) {
  const { availableWidgetTypes, loadWidgetTypes, addWidget, saveLayout } = useDashboardStore();
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    if (isOpen && availableWidgetTypes.length === 0) {
      loadWidgetTypes();
    }
  }, [isOpen, availableWidgetTypes.length, loadWidgetTypes]);

  const handleAdd = async () => {
    if (!selectedType) return;

    addWidget(selectedType.id, selectedType.settings || {});
    await saveLayout();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Widget">
      <div className="space-y-4">
        <p className="text-slate-400 text-sm">Select a widget to add to your dashboard</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {availableWidgetTypes.map((widgetType) => (
            <button
              key={widgetType.id}
              onClick={() => setSelectedType(widgetType)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedType?.id === widgetType.id
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <h3 className="font-semibold text-white mb-1">{widgetType.name}</h3>
              <p className="text-sm text-slate-400">{widgetType.description}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={!selectedType}
          >
            Add Widget
          </Button>
        </div>
      </div>
    </Modal>
  );
}
