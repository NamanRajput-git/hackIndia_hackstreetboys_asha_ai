import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Smile, Frown, Meh, CloudRain } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { DailyLog } from '../../types';
import VoiceInput from '../ui/VoiceInput';
import { Button } from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
}

const MOODS = [
  { label: 'Happy', icon: Smile, color: 'text-green-500 bg-green-50 border-green-200' },
  { label: 'Neutral', icon: Meh, color: 'text-yellow-500 bg-yellow-50 border-yellow-200' },
  { label: 'Sad', icon: Frown, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { label: 'Pain', icon: CloudRain, color: 'text-red-500 bg-red-50 border-red-200' },
];

const SYMPTOMS = ['Cramps', 'Headache', 'Fatigue', 'Bloating', 'Nausea', 'Acne', 'Backache'];

export default function LogModal({ isOpen, onClose, date }: LogModalProps) {
  const { currentUser, dailyLogs, addDailyLog } = useStore();
  const { t } = useTranslation();
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const existingLog = dailyLogs.find(l => l.date === dateStr && l.userId === currentUser?.id);

  const [mood, setMood] = useState<DailyLog['mood']>('Neutral');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingLog) {
      setMood(existingLog.mood);
      setSymptoms(existingLog.symptoms);
      setNotes(existingLog.notes);
    } else {
      setMood('Neutral');
      setSymptoms([]);
      setNotes('');
    }
  }, [existingLog, dateStr, isOpen]);

  const handleSave = () => {
    if (!currentUser) return;
    addDailyLog({
      userId: currentUser.id,
      date: dateStr,
      mood,
      symptoms,
      notes
    });
    onClose();
  };

  const toggleSymptom = (s: string) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
  };

  const handleVoiceResult = (text: string) => {
    setNotes(prev => prev + (prev ? ' ' : '') + text);
    if (text.toLowerCase().includes('headache')) toggleSymptom('Headache');
    if (text.toLowerCase().includes('pain')) setMood('Pain');
    if (text.toLowerCase().includes('happy')) setMood('Happy');
    if (text.toLowerCase().includes('sad')) setMood('Sad');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('tracker.health_log')}</h2>
                <p className="text-sm text-slate-500">{format(date, 'EEEE, d MMMM')}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={24} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('tracker.mood')}</h3>
                <div className="flex justify-between gap-2">
                  {MOODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = mood === m.label;
                    return (
                      <button
                        key={m.label}
                        onClick={() => setMood(m.label as any)}
                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                          isSelected ? m.color : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon size={24} />
                        <span className="text-xs font-bold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('tracker.symptoms')}</h3>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        symptoms.includes(s) 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('tracker.voice_log')}</h3>
                <VoiceInput onResult={handleVoiceResult} label={t('tracker.tap_speak')} />
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('tracker.notes')}</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else you want to note?"
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-rose-500 min-h-[100px]"
                />
              </section>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={handleSave} className="w-full bg-rose-600 hover:bg-rose-700 py-4 text-lg">
                <Save className="w-5 h-5 mr-2" /> {t('common.save')}
              </Button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
