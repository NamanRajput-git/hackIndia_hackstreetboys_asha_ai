import { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface EducationCardProps {
  topic: {
    id: string;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    color: string;
    content: string[];
  };
}

export default function EducationCard({ topic }: EducationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = topic.icon;

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-3 ${topic.color} transition-all hover:shadow-md`}
      >
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Icon className="w-6 h-6 opacity-80" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 leading-tight">{topic.title}</h3>
          <p className="text-xs text-slate-600 font-medium mt-1">{topic.subtitle}</p>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className={`p-6 ${topic.color} flex justify-between items-start`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{topic.title}</h3>
                    <p className="opacity-80">{topic.subtitle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/50 rounded-full hover:bg-white/80 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <ul className="space-y-4">
                  {topic.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700 font-medium text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg"
                >
                  Okay, I understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
