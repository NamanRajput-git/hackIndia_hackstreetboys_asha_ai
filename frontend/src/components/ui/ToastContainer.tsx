import { AnimatePresence, motion } from 'framer-motion';
import { useToast, ToastType } from '../../store/useToast';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle
};

const styles = {
  success: 'bg-white border-green-100 text-slate-800 shadow-lg shadow-green-900/5',
  error: 'bg-white border-red-100 text-slate-800 shadow-lg shadow-red-900/5',
  info: 'bg-white border-blue-100 text-slate-800 shadow-lg shadow-blue-900/5',
  warning: 'bg-white border-orange-100 text-slate-800 shadow-lg shadow-orange-900/5'
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-orange-500'
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              layout
              className={clsx(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border min-w-[300px] max-w-sm backdrop-blur-xl",
                styles[toast.type]
              )}
            >
              <div className={clsx("p-2 rounded-full bg-slate-50", iconColors[toast.type])}>
                <Icon size={20} />
              </div>
              <p className="flex-1 text-sm font-bold">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
