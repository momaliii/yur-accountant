import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Scroll page to top when modal opens
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Scroll modal container and content to top when opened
      const scrollToTop = () => {
        const modalContainer = document.querySelector('[data-modal-container]');
        const modalContent = document.querySelector('[data-modal-content]');
        if (modalContainer) {
          modalContainer.scrollTop = 0;
        }
        if (modalContent) {
          modalContent.scrollTop = 0;
        }
      };
      
      // Immediate scroll
      scrollToTop();
      
      // Delayed scrolls to ensure it works after render
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 100);
      setTimeout(scrollToTop, 200);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center p-2 sm:p-4 overflow-y-auto"
      data-modal-container
      style={{ height: '772px' }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - appears at top when opened */}
      <div 
        className={`relative w-full ${sizes[size]} glass rounded-xl sm:rounded-2xl 
          animate-fade-in max-h-[90vh] flex flex-col mx-2 sm:mx-0 my-4 sm:my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-white pr-2">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0" data-modal-content>
          {children}
        </div>
      </div>
    </div>
  );
}

