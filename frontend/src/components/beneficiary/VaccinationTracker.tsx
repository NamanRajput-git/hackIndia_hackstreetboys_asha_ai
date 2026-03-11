import { useState } from 'react';
import { Child } from '../../types';
import { VACCINE_SCHEDULE } from '../../data/vaccines';
import { addWeeks, format, isPast, differenceInWeeks } from 'date-fns';
import { CheckCircle2, Circle, Syringe, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  child: Child;
}

export default function VaccinationTracker({ child }: Props) {
  const { updateChild } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const dob = new Date(child.dob);
  const completedVaccines = child.vaccinations || [];
  const ageInWeeks = differenceInWeeks(new Date(), dob);

  const toggleVaccine = (vaccineId: string) => {
    const isCompleted = completedVaccines.includes(vaccineId);
    const newVaccines = isCompleted 
      ? completedVaccines.filter(id => id !== vaccineId)
      : [...completedVaccines, vaccineId];
    
    updateChild(child.id, { vaccinations: newVaccines });
  };

  const getStatus = (vaccine: typeof VACCINE_SCHEDULE[0]) => {
    if (completedVaccines.includes(vaccine.id)) return 'completed';
    const dueDate = addWeeks(dob, vaccine.dueWeek);
    if (isPast(dueDate)) return 'overdue';
    if (vaccine.dueWeek - ageInWeeks <= 2) return 'due_soon';
    return 'upcoming';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
            <Syringe size={20} />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900">Vaccinations</h4>
            <p className="text-xs text-slate-500">
              {completedVaccines.length} / {VACCINE_SCHEDULE.length} Completed
            </p>
          </div>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 bg-white">
              {VACCINE_SCHEDULE.map(vaccine => {
                const status = getStatus(vaccine);
                const dueDate = addWeeks(dob, vaccine.dueWeek);
                
                return (
                  <div key={vaccine.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleVaccine(vaccine.id)}
                        className={`transition-colors ${
                          status === 'completed' ? 'text-green-500' : 'text-slate-300 hover:text-green-400'
                        }`}
                      >
                        {status === 'completed' ? <CheckCircle2 size={24} className="fill-current" /> : <Circle size={24} />}
                      </button>
                      <div>
                        <p className={`font-bold text-sm ${status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {vaccine.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Due: {format(dueDate, 'dd MMM yyyy')} • {vaccine.description}
                        </p>
                      </div>
                    </div>
                    
                    {status !== 'completed' && status !== 'upcoming' && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
