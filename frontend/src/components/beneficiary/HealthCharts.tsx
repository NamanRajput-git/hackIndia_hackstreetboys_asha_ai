import { useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart2, List } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// --- Types ---
interface ChartDataPoint {
  day: string; // e.g., "13", "14"
  value: number;
  label?: string; // e.g., "60 kg"
}

interface BarChartWidgetProps {
  title: string;
  unit: string;
  data: ChartDataPoint[];
  colorTheme: 'green' | 'orange' | 'blue';
  goal?: number; // For Water chart
}

// --- Reusable Bar Chart Widget ---
export function BarChartWidget({ title, unit, data, colorTheme, goal }: BarChartWidgetProps) {
  const [selectedDay, setSelectedDay] = useState<string>(data[1].day); // Default select 2nd item like image

  const theme = {
    green: {
      bar: 'bg-[#CBE8A9]',
      activeBar: 'bg-[#8BC34A]',
      text: 'text-[#8BC34A]',
      icon: 'bg-[#8BC34A]',
    },
    orange: {
      bar: 'bg-[#FFDCA8]',
      activeBar: 'bg-[#FF9800]',
      text: 'text-[#FF9800]',
      icon: 'bg-[#FF9800]',
    },
    blue: {
      bar: 'bg-[#90CAF9]',
      activeBar: 'bg-[#2196F3]',
      text: 'text-[#2196F3]',
      icon: 'bg-[#2196F3]',
    }
  }[colorTheme];

  const maxValue = Math.max(...data.map(d => d.value), goal || 0) * 1.2;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
          {title} <span className="text-sm text-slate-500 font-normal">({unit})</span>
        </h3>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button className={clsx("p-1.5 rounded-md text-white shadow-sm", theme.icon)}>
            <BarChart2 size={16} />
          </button>
          <button className="p-1.5 rounded-md text-slate-400 hover:bg-white dark:hover:bg-slate-700">
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Date Nav */}
      <div className="flex items-center justify-center gap-4 mb-6 text-sm font-bold text-slate-800 dark:text-slate-200">
        <button className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
        <span>Aug 13 - Aug 19, 2024</span>
        <button className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
      </div>

      {/* Chart Area */}
      <div className="relative h-48 flex items-end justify-between px-2 gap-2">
        {/* Y-Axis Labels (Simple) */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-slate-400 w-6">
           <span>{Math.round(maxValue)}</span>
           <span>{Math.round(maxValue * 0.75)}</span>
           <span>{Math.round(maxValue * 0.5)}</span>
           <span>{Math.round(maxValue * 0.25)}</span>
           <span>0</span>
        </div>

        {/* Goal Line (Water) */}
        {goal && (
          <div 
            className="absolute left-8 right-0 border-t-2 border-dashed border-blue-300 z-0"
            style={{ bottom: `${(goal / maxValue) * 100}%` }}
          />
        )}

        {/* Bars */}
        <div className="flex-1 flex items-end justify-between pl-8 relative z-10 h-full">
          {data.map((d) => {
            const isActive = selectedDay === d.day;
            const heightPercent = (d.value / maxValue) * 100;
            
            return (
              <div key={d.day} className="flex flex-col items-center gap-2 w-full group cursor-pointer" onClick={() => setSelectedDay(d.day)}>
                {/* Tooltip Bubble */}
                <div className="relative w-full flex justify-center h-full items-end">
                   {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={clsx(
                        "absolute -top-12 border-2 bg-white dark:bg-slate-800 rounded-full w-12 h-12 flex flex-col items-center justify-center shadow-md z-20",
                        theme.text,
                        colorTheme === 'green' ? 'border-[#8BC34A]' : colorTheme === 'orange' ? 'border-[#FF9800]' : 'border-[#2196F3]'
                      )}
                    >
                      <span className="text-xs font-bold leading-none">{d.value}</span>
                      <span className="text-[8px] leading-none mt-0.5">{unit}</span>
                      {/* Triangle */}
                      <div className={clsx(
                        "absolute -bottom-1.5 w-3 h-3 bg-white dark:bg-slate-800 border-b-2 border-r-2 rotate-45",
                         colorTheme === 'green' ? 'border-[#8BC34A]' : colorTheme === 'orange' ? 'border-[#FF9800]' : 'border-[#2196F3]'
                      )}></div>
                    </motion.div>
                  )}
                  
                  {/* The Bar */}
                  <div 
                    className={clsx(
                      "w-full max-w-[24px] rounded-t-xl transition-all duration-300",
                      isActive ? theme.activeBar : theme.bar
                    )}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                
                {/* X-Axis Label */}
                <span className={clsx("text-xs font-medium", isActive ? "text-slate-900 dark:text-white font-bold" : "text-slate-400")}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- BMI Gauge Widget ---
export function BMIGaugeWidget() {
  const bmi = 22.0;
  
  // Legend Data
  const ranges = [
    { label: 'Very severely underweight', range: '< 16.0', color: 'bg-blue-400' },
    { label: 'Severely underweight', range: '16.0 - 16.9', color: 'bg-blue-300' },
    { label: 'Underweight', range: '17.0 - 18.4', color: 'bg-cyan-400' },
    { label: 'Normal', range: '18.5 - 24.9', color: 'bg-green-500', active: true },
    { label: 'Overweight', range: '25.0 - 29.9', color: 'bg-yellow-400' },
    { label: 'Obese Class I', range: '30.0 - 34.9', color: 'bg-orange-400' },
    { label: 'Obese Class II', range: '35.0 - 39.9', color: 'bg-orange-500' },
    { label: 'Obese Class III', range: '≥ 40.0', color: 'bg-red-500' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">BMI</h3>
        <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">Normal</span>
      </div>

      {/* Gauge Visualization */}
      <div className="relative h-48 w-full flex justify-center overflow-hidden">
        <svg viewBox="0 0 200 110" className="w-64 h-32">
          {/* Background Arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />
          
          {/* Colored Segments (Simplified for visual match) */}
          <path d="M 20 100 A 80 80 0 0 1 60 40" fill="none" stroke="#22c55e" strokeWidth="20" strokeLinecap="round" strokeDasharray="2 2" className="text-green-500" />
          <path d="M 60 40 A 80 80 0 0 1 140 40" fill="none" stroke="#facc15" strokeWidth="20" strokeLinecap="round" strokeDasharray="2 2" />
          <path d="M 140 40 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="20" strokeLinecap="round" strokeDasharray="2 2" />

          {/* Needle */}
          <g transform="rotate(-45 100 100)"> {/* Rotated to point to 'Normal' roughly */}
             <circle cx="100" cy="100" r="8" fill="white" stroke="#22c55e" strokeWidth="3" />
             <path d="M 100 108 L 100 25" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" className="opacity-50" />
          </g>
        </svg>

        {/* Value Text */}
        <div className="absolute bottom-0 text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white">{bmi.toFixed(1)}</h2>
          <p className="text-xs text-slate-500">BMI (kg/m2)</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-3">
        {ranges.map((r, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${r.color}`}></div>
              <span className={clsx("text-slate-600 dark:text-slate-400", r.active && "font-bold text-slate-900 dark:text-white")}>
                {r.label}
              </span>
            </div>
            <span className={clsx("text-slate-500", r.active && "font-bold text-slate-900 dark:text-white")}>
              BMI {r.range}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
