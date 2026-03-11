import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../../store/useStore';

interface CalendarWidgetProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function CalendarWidget({ selectedDate, onDateSelect }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { dailyLogs } = useStore();

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const hasLog = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dailyLogs.some(log => log.date === dateStr);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={`${day}-${i}`} className="text-xs font-bold text-slate-400">{day}</div>
        ))}
        
        {/* Padding for start of month */}
        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);
          const logExists = hasLog(day);

          return (
            <button
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={clsx(
                "relative h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all mx-auto",
                !isCurrentMonth && "text-slate-300 dark:text-slate-700",
                isSelected ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
                isDayToday && !isSelected && "border border-rose-500 text-rose-500"
              )}
            >
              {format(day, 'd')}
              {logExists && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 bg-rose-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
