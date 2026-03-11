import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Calendar, Edit2, Plus } from 'lucide-react';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { useStore } from '../../store/useStore';
import { calculateCycleInsights } from '../../utils/healthCalculators';
import { format } from 'date-fns';
import CalendarWidget from '../../components/beneficiary/CalendarWidget';
import LogModal from '../../components/beneficiary/LogModal';
import { useTranslation } from '../../hooks/useTranslation';

export default function CycleTrackerScreen() {
  const navigate = useNavigate();
  const { currentUser, beneficiaries, updateBeneficiaryProfile, dailyLogs } = useStore();
  const { t } = useTranslation();
  
  const profile = beneficiaries.find(b => b.userId === currentUser?.id);
  const [setupDate, setSetupDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const handleSetup = async () => {
    if (profile && setupDate) {
      await updateBeneficiaryProfile(profile.id, { lastPeriodDate: setupDate });
    }
  };

  if (!profile || !profile.lastPeriodDate) {
    return (
      <RoleLayout role="beneficiary" hideHeader={true}>
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center">
          <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm">
            <ArrowLeft className="w-6 h-6 text-slate-800" />
          </button>
          
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
              <Calendar size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">{t('dash.setup')}</h1>
            <p className="text-slate-500 font-medium mb-8">
              {t('dash.setup_desc')}
            </p>
            
            <input 
              type="date" 
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900 mb-6 focus:ring-2 focus:ring-rose-500 outline-none"
              onChange={(e) => setSetupDate(e.target.value)}
            />
            
            <button 
              onClick={handleSetup}
              disabled={!setupDate}
              className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('common.submit')}
            </button>
          </div>
        </div>
      </RoleLayout>
    );
  }

  const insights = calculateCycleInsights(profile.lastPeriodDate);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const currentLog = dailyLogs.find(l => l.date === selectedDateStr && l.userId === currentUser?.id);

  return (
    <RoleLayout role="beneficiary" hideHeader={true}>
      <div className="min-h-screen bg-slate-50 p-4 pb-24">
        
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100">
            <ArrowLeft className="w-6 h-6 text-slate-800" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">{t('tracker.title')}</h1>
          <div className="w-10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-400 to-purple-500" />
            
            <div className="flex justify-between items-start mb-8 mt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('tracker.prediction')}</h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">{t('tracker.regular')}</span>
            </div>

            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl font-black text-rose-500">{insights.daysToNextPeriod}</span>
                <span className="text-xl font-bold text-slate-400">days</span>
              </div>
              <p className="text-slate-500 font-medium mt-2">{t('dash.days_to_period')}</p>
              <p className="text-slate-900 font-bold mt-1">Expected: <span className="text-slate-900">{insights.nextPeriod}</span></p>
            </div>

            <div className="flex gap-3 justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200 bg-purple-50">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs font-bold text-purple-700">{t('tracker.fertile')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-10 -mt-10" />
             
             <div className="w-16 h-16 bg-white rounded-full shadow-lg shadow-rose-100 flex items-center justify-center mb-4 relative z-10">
               <Mic className="w-8 h-8 text-rose-500" />
             </div>
             
             <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">{t('tracker.voice_log')}</h3>
             <p className="text-slate-400 text-sm font-medium mb-6 max-w-[200px] relative z-10">
               {t('tracker.voice_desc')}
             </p>

             <button 
               onClick={() => setIsLogModalOpen(true)}
               className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-200 hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10"
             >
               {t('tracker.tap_speak')}
             </button>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <CalendarWidget 
              selectedDate={selectedDate} 
              onDateSelect={setSelectedDate} 
            />
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('tracker.health_log')}</h3>
                <p className="text-xs text-slate-400 font-bold">{format(selectedDate, 'MMMM d, yyyy')}</p>
              </div>
              <button 
                onClick={() => setIsLogModalOpen(true)}
                className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-rose-100"
              >
                {currentLog ? <Edit2 size={12} /> : <Plus size={12} />}
                {currentLog ? t('tracker.edit_log') : t('tracker.add_log')}
              </button>
            </div>

            {currentLog ? (
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">
                    {currentLog.mood === 'Happy' ? '😊' : 
                     currentLog.mood === 'Sad' ? '😔' : 
                     currentLog.mood === 'Pain' ? '😣' : '😐'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">{t('tracker.mood')}</p>
                    <p className="font-bold text-slate-900">{currentLog.mood}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentLog.symptoms.length > 0 ? (
                    currentLog.symptoms.map(s => (
                      <span key={s} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold">
                        {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">No symptoms recorded.</p>
                  )}
                </div>
                
                {currentLog.notes && (
                  <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600 italic">
                    "{currentLog.notes}"
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <p className="text-slate-400 font-medium text-sm">{t('tracker.no_logs')}</p>
                <button 
                  onClick={() => setIsLogModalOpen(true)}
                  className="mt-4 text-rose-500 font-bold text-sm hover:underline"
                >
                  + {t('tracker.add_log')}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <LogModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        date={selectedDate} 
      />
    </RoleLayout>
  );
}
