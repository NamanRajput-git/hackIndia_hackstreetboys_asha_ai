import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, CalendarClock, ChevronRight, ArrowUpRight, Syringe, Baby, UserPlus, Flower2, User } from 'lucide-react';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTranslation } from '../../hooks/useTranslation';
import { VACCINE_SCHEDULE } from '../../data/vaccines';
import { differenceInWeeks, isSameDay, parseISO } from 'date-fns';

export default function AshaDashboard() {
  const { beneficiaries, alerts, children, healthLogs } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch initial data if store is empty
  useEffect(() => {
    if (beneficiaries.length === 0) {
      useStore.getState().fetchInitialData();
    }
  }, [beneficiaries.length]);

  const activeAlerts = alerts?.filter(a => a.status === 'open') || [];

  // Filter out patients who have already been visited today
  const highRiskPatients = (beneficiaries || []).filter(b => {
    if (!b) return false;
    const isRisk = b.riskLevel === 'high' || b.riskLevel === 'medium';

    // Check if a log exists for this beneficiary with today's date
    const visitedToday = (healthLogs || []).some(log => {
      if (!log || log.beneficiaryId !== b.id) return false;
      // Handle both ISO strings and Date objects safely
      try {
        const logDate = typeof log.date === 'string' ? parseISO(log.date) : new Date(log.date);
        return isSameDay(logDate, new Date());
      } catch (e) {
        return false;
      }
    });

    return isRisk && !visitedToday;
  });

  // Logic to find children with upcoming vaccines
  const dueVaccines = (children || []).flatMap(child => {
    if (!child) return [];
    try {
      const dob = new Date(child.dob);
      const ageInWeeks = differenceInWeeks(new Date(), dob);

      // Find vaccines due within +/- 2 weeks that are NOT taken
      const upcoming = VACCINE_SCHEDULE.filter(v => {
        const isTaken = child.vaccinations?.includes(v.id);
        if (isTaken) return false;

        const dueInWeeks = v.dueWeek - ageInWeeks;
        return dueInWeeks <= 4 && dueInWeeks >= -4; // Due soon or slightly overdue
      });

      if (upcoming.length === 0) return [];

      const mother = beneficiaries.find(b => b.id === child.beneficiaryId);
      return upcoming.map(v => ({
        childName: child.name,
        motherName: mother?.name || 'Unknown',
        vaccineName: v.name,
        beneficiaryId: child.beneficiaryId,
        isOverdue: v.dueWeek < ageInWeeks
      }));
    } catch (e) {
      return [];
    }
  });

  const StatCard = ({ title, count, subtitle, color, onClick }: any) => (
    <div
      onClick={onClick}
      className={`p-6 rounded-[2.5rem] ${color} cursor-pointer transition-transform hover:-translate-y-1 shadow-sm group`}
    >
      <div className="flex justify-between items-start mb-6">
        <p className="text-xs font-bold tracking-widest opacity-60 uppercase">{subtitle}</p>
        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight size={16} className="text-black" />
        </div>
      </div>
      <h3 className="text-5xl font-black mb-2 text-slate-900">{count}</h3>
      <p className="font-bold text-xl text-slate-900">{title}</p>
    </div>
  );

  const getPatientIcon = (type: string) => {
    switch (type) {
      case 'mother': return <Baby size={20} />;
      case 'pregnant': return <UserPlus size={20} />;
      case 'girl': return <Flower2 size={20} />;
      default: return <User size={20} />;
    }
  };

  return (
    <RoleLayout role="asha_worker" title={t('asha.dashboard')}>
      <div className="space-y-6">

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title={t('nav.patients')}
            count={beneficiaries.length}
            subtitle={t('asha.patients_total')}
            color="bg-[#CCFBF1]"
            onClick={() => navigate('/asha/patients')}
          />
          <StatCard
            title={t('nav.alerts')}
            count={activeAlerts.length}
            subtitle={t('asha.alerts_active')}
            color="bg-[#FFE4E6]"
            onClick={() => navigate('/asha/alerts')}
          />
        </div>

        {/* Visit Scheduler Quick Access */}

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => navigate('/asha/scheduler')}
            className="p-5 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 cursor-pointer transition-transform hover:-translate-y-1 shadow-lg group"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CalendarClock className="text-white w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Visit Scheduler</h3>
                  <p className="text-teal-100 text-sm font-medium">Plan and track home visits</p>
                </div>
              </div>
              <ChevronRight className="text-white w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/asha/schemes')}
            className="p-5 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 cursor-pointer transition-transform hover:-translate-y-1 shadow-lg group"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="text-white w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Schemes</h3>
                  <p className="text-violet-100 text-sm font-medium">Enroll & Manage Schemes</p>
                </div>
              </div>
              <ChevronRight className="text-white w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Critical Alerts Section */}
        {activeAlerts.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="text-red-600 w-6 h-6" />
                {t('asha.critical_alerts')}
              </h2>
            </div>
            <div className="space-y-3">
              {activeAlerts.slice(0, 2).map(alert => {
                const patient = beneficiaries.find(b => b.id === alert.beneficiaryId);
                return (
                  <GlassCard key={alert.id} className="p-6 border-l-8 border-l-red-500 bg-red-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-red-900 text-lg">{patient?.name || 'Unknown'}</h3>
                        <p className="text-sm text-red-700 font-medium mt-1">SOS Triggered • {new Date(alert.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <ChevronRight className="text-red-500" />
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>
        )}

        {/* Vaccination Due Widget */}
        {dueVaccines.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Syringe className="w-6 h-6 text-indigo-600" />
                {t('asha.vaccines_due')}
              </h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                {dueVaccines.length} Due
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {dueVaccines.map((item, idx) => (
                <GlassCard
                  key={idx}
                  onClick={() => navigate(`/asha/patient/${item.beneficiaryId}`)}
                  className="min-w-[240px] p-4 border-l-4 border-l-indigo-500 bg-indigo-50/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <Baby size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.childName}</h4>
                      <p className="text-xs text-slate-500">M: {item.motherName}</p>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md shadow-sm">
                        <Syringe size={12} className={item.isOverdue ? "text-red-500" : "text-indigo-500"} />
                        <span className={`text-xs font-bold ${item.isOverdue ? "text-red-600" : "text-indigo-600"}`}>
                          {item.vaccineName}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        )}

        {/* High Risk Follow Ups */}
        <section className="pb-20">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-teal-600" />
              {t('asha.follow_ups')}
            </h2>
            <button onClick={() => navigate('/asha/patients')} className="text-sm font-bold text-teal-600 uppercase tracking-wide">{t('common.view_all')}</button>
          </div>

          <div className="space-y-3">
            {highRiskPatients.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 text-sm font-medium">All high-risk visits completed for today! 🎉</p>
              </div>
            ) : (
              highRiskPatients.slice(0, 5).map(patient => (
                <GlassCard
                  key={patient.id}
                  onClick={() => navigate(`/asha/patient/${patient.id}`)}
                  className="p-5 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${patient.riskLevel === 'high' ? 'bg-red-500' : 'bg-orange-500'
                      }`}>
                      {getPatientIcon(patient.userType)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{patient.name}</h3>
                      <div className="flex items-center text-slate-500 text-sm mt-1 font-medium">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{patient.address || 'Location not set'} • Due Today</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300" />
                </GlassCard>
              ))
            )}
          </div>
        </section>
      </div>
    </RoleLayout >
  );
}
