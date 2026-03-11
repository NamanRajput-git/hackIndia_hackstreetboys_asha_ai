import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Language } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'bho', label: 'Bhojpuri', native: 'भोजपुरी' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

export function LanguageToggle() {
  const { language, setLanguage } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-white/20 dark:bg-slate-800/40 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        aria-label="Change Language"
      >
        <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
          {language}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
                      language === lang.code
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{lang.native}</p>
                      <p className="text-xs opacity-60">{lang.label}</p>
                    </div>
                    {language === lang.code && <Check size={16} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
