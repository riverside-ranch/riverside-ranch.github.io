import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-wood-900 rounded-xl shadow-2xl border border-parchment-200 dark:border-wood-700 w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200 dark:border-wood-800">
          <h2 className="font-display text-lg font-semibold text-parchment-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-parchment-100 dark:hover:bg-wood-800 transition-colors text-parchment-400 dark:text-parchment-400">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
