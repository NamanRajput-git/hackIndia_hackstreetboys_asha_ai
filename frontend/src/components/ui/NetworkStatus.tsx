import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatus() {
  const { isOnline, isSyncing, syncQueue } = useStore();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissal when critical status changes (e.g. going offline)
  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false); // Always reappear when connection is lost
    }
  }, [isOnline]);

  // Show if (offline OR syncing OR pending items) AND not dismissed
  const shouldShow = (!isOnline || isSyncing || syncQueue.length > 0) && !isDismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`relative w-full text-center text-xs font-bold py-1 px-4 flex items-center justify-center gap-2 ${
            !isOnline 
              ? 'bg-slate-800 text-white' 
              : isSyncing 
                ? 'bg-blue-600 text-white' 
                : 'bg-orange-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <>
                <WifiOff size={12} />
                <span>You are offline. Changes saved locally.</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Syncing data...</span>
              </>
            ) : (
              <>
                <Wifi size={12} />
                <span>{syncQueue.length} items pending sync</span>
              </>
            )}
          </div>

          <button 
            onClick={() => setIsDismissed(true)}
            className="absolute right-4 p-0.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
