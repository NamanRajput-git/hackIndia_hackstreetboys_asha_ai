import { Moon, Sun } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, toggleTheme } = useStore();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-white/20 dark:bg-slate-800/40 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
      aria-label="Toggle Theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? (
          <Moon className="w-5 h-5 text-indigo-300" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" />
        )}
      </motion.div>
    </button>
  );
}
