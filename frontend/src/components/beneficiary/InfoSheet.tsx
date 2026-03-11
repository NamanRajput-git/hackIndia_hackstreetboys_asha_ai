import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Section {
  title: string;
  content: string;
  badge?: string;
}

interface InfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  image: string; // URL or component
  sections: Section[];
  themeColor?: string; // Tailwind class like 'bg-rose-500'
}

export default function InfoSheet({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  image, 
  sections,
  themeColor = 'bg-rose-500' 
}: InfoSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center sm:items-end sm:justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 h-[90vh] sm:h-auto sm:max-h-[85vh] sm:rounded-t-3xl rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header / Close */}
            <div className="absolute top-6 left-6 z-10">
              <button 
                onClick={onClose}
                className="p-2 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-800 dark:text-white" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 no-scrollbar">
              
              {/* Hero Illustration */}
              <div className="pt-16 pb-6 flex justify-center">
                <div className="relative">
                  <div className={`absolute inset-0 ${themeColor} opacity-20 blur-3xl rounded-full scale-150`}></div>
                  <img src={image} alt={title} className="w-48 h-48 object-contain relative z-10 drop-shadow-xl" />
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center px-6 mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
              </div>

              {/* Content Cards */}
              <div className="px-6 pb-12 space-y-4">
                {sections.map((section, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{section.title}</h3>
                      {section.badge && (
                        <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
