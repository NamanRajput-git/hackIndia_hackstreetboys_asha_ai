import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function SOSButton({ beneficiaryId }: { beneficiaryId: string }) {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerSOS = useStore(state => state.triggerSOS);

  const handleMouseDown = () => {
    if (triggered) return;
    setIsPressing(true);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += 2;
      setProgress(p);
      if (p >= 100) {
        clearInterval(timerRef.current!);
        setTriggered(true);
        triggerSOS(beneficiaryId);
        setIsPressing(false);
      }
    }, 20);
  };

  const handleMouseUp = () => {
    if (triggered) return;
    setIsPressing(false);
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (triggered) {
    return (
      <div className="w-full bg-red-100 border-2 border-red-500 rounded-2xl p-6 text-center animate-pulse">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-2" />
        <h3 className="text-xl font-bold text-red-800">SOS SENT!</h3>
        <p className="text-red-600">Help is on the way.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full select-none touch-none">
      <motion.button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        whileTap={{ scale: 0.95 }}
        className="w-full h-48 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200 flex flex-col items-center justify-center relative overflow-hidden"
      >
        <div 
          className="absolute bottom-0 left-0 w-full bg-black/20 transition-all duration-75 ease-linear"
          style={{ height: `${progress}%` }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <AlertTriangle className="w-16 h-16 text-white mb-2" />
          <span className="text-2xl font-bold text-white tracking-wider">SOS</span>
          <span className="text-white/80 text-sm mt-1">Long Press for Emergency</span>
        </div>
      </motion.button>
    </div>
  );
}
