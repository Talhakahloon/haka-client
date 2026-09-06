import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { X } from 'lucide-react';

export default function Toaster() {
  const { toasts, removeToast } = useNotification();

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className="pointer-events-auto bg-card text-card-foreground border shadow-lg rounded-lg p-4 w-80 flex items-start justify-between"
        >
          <div className="flex-1 mr-2">
            <h4 className="text-sm font-semibold">{toast.title}</h4>
            {toast.description && <p className="text-xs text-muted-foreground mt-1">{toast.description}</p>}
            {toast.action && (
              <button 
                onClick={() => {
                  toast.action.onClick();
                  removeToast(toast.id);
                }}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
