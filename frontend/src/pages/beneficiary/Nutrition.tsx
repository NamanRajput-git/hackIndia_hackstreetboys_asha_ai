import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Pill, CheckCircle2, Droplets } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ANEMIA_PLAN, SUPERFOODS } from '../../data/nutritionPlans';
import { GlassCard } from '../../components/ui/GlassCard';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';

export default function BeneficiaryNutrition() {
  const navigate = useNavigate();
  const { currentUser, beneficiaries } = useStore();
  const { t } = useTranslation();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [ifaTaken, setIfaTaken] = useState(false);

  const profile = beneficiaries.find(b => b.userId === currentUser?.id) || beneficiaries[0];
  const anemiaStatus = profile?.anemiaStatus || 'normal';
  const isAnemic = anemiaStatus !== 'normal';
  
  const currentPlan = ANEMIA_PLAN[selectedDayIndex];

  const handleNextDay = () => {
    setSelectedDayIndex(prev => (prev + 1) % 7);
  };

  const handlePrevDay = () => {
    setSelectedDayIndex(prev => (prev - 1 + 7) % 7);
  };

  // Dynamic Theme based on Anemia Status
  const getTheme = () => {
    switch(anemiaStatus) {
      case 'severe': 
        return { 
          card: 'bg-red-600 shadow-red-500/20', 
          subtext: 'text-red-100',
          hb: '8.5', // Mock lower Hb for severe
          statusLabel: 'Severe Anemia',
          textColor: 'text-red-600'
        };
      case 'moderate': 
        return { 
          card: 'bg-orange-600 shadow-orange-500/20', 
          subtext: 'text-orange-100',
          hb: '9.8',
          statusLabel: 'Moderate Anemia',
          textColor: 'text-orange-600'
        };
      case 'mild': 
        return { 
          card: 'bg-yellow-500 shadow-yellow-500/20', 
          subtext: 'text-yellow-100',
          hb: '10.5',
          statusLabel: 'Mild Anemia',
          textColor: 'text-yellow-600'
        };
      default: 
        return { 
          card: 'bg-emerald-600 shadow-emerald-500/20', 
          subtext: 'text-emerald-100',
          hb: '12.2',
          statusLabel: 'Normal',
          textColor: 'text-emerald-600'
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="bg-white dark:bg-slate-900 p-4 sticky top-0 z-20 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          <ArrowLeft className="w-6 h-6 text-slate-800 dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('nutri.title')}</h1>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        
        <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl transition-colors duration-300 ${theme.card}`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
          
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">{t('nutri.title')}</h2>
              <p className={`${theme.subtext} text-sm font-medium`}>
                {isAnemic ? t('nutri.anemia_fight') : t('nutri.healthy_diet')}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={`w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${theme.textColor}`}>
                    Hb
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase opacity-80 font-bold">{t('nutri.hemoglobin')}</p>
                    <p className="text-lg font-bold leading-none">{theme.hb} <span className="text-[10px] font-normal">g/dL</span></p>
                  </div>
                </div>
                {isAnemic && (
                  <span className="inline-block bg-white text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm capitalize">
                    {theme.statusLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <GlassCard className="p-2 flex items-center justify-between bg-white border-slate-100 shadow-sm">
          <button onClick={handlePrevDay} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">{currentPlan.day}</h3>
            <p className="text-sm text-emerald-600 font-bold">{currentPlan.localDay}</p>
          </div>
          <button onClick={handleNextDay} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronRight size={20} />
          </button>
        </GlassCard>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
            <h3 className="font-bold text-slate-800 dark:text-white">{t('nutri.recommended')}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="wait">
              {currentPlan.meals.slice(0, 2).map((meal, idx) => {
                const Icon = meal.icon;
                return (
                  <motion.div
                    key={`${currentPlan.day}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <GlassCard className="p-4 h-full flex flex-col justify-between bg-white border-slate-100 shadow-sm group hover:border-orange-200 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                          <Icon className="text-orange-500 w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{meal.type}</p>
                          <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{meal.title}</h4>
                          <p className="text-slate-500 text-sm font-medium">{meal.subtitle}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {meal.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <Pill className="w-8 h-8 text-red-500 -rotate-45" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{t('dash.ifa')}</h3>
              <p className="text-slate-400 text-sm mb-6">Take after lunch with lemon water.</p>
              
              <button
                onClick={() => setIfaTaken(!ifaTaken)}
                className={clsx(
                  "w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2",
                  ifaTaken 
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/20" 
                    : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                )}
              >
                {ifaTaken ? (
                  <>
                    <CheckCircle2 size={18} /> {t('nutri.taken')}
                  </>
                ) : (
                  t('nutri.mark_taken')
                )}
              </button>
            </div>
          </div>

          <GlassCard className="p-6 bg-white border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">{t('nutri.superfoods')}</h3>
            <div className="space-y-3">
              {SUPERFOODS.map(food => (
                <div key={food.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                  <div className="text-2xl">{food.image}</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{food.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{food.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-center gap-4 border border-blue-100 dark:border-blue-800">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
             <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t('nutri.hydration')}</h4>
             <p className="text-xs text-slate-600 dark:text-slate-400">{t('nutri.hydration_desc')}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
