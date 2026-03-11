import { useStore } from '../../store/useStore';
import SOSButton from '../../components/SOSButton';
import { Pill, Gift, Apple, BookOpen, QrCode, ArrowUpRight, Calendar, AlertCircle, Baby, Syringe, Heart, Stethoscope, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateCycleInsights } from '../../utils/healthCalculators';
import { useState, useEffect } from 'react';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { format, addDays } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';

export default function BeneficiaryDashboard() {
  const { currentUser, beneficiaries, ensureBeneficiaryProfile, children, enrollments, schemes } = useStore();
  const navigate = useNavigate();
  const [ifaTaken, setIfaTaken] = useState(false);
  const { t } = useTranslation();
  
  useEffect(() => {
    if (currentUser && currentUser.role === 'beneficiary') {
      const exists = beneficiaries.find(b => b.userId === currentUser.id);
      if (!exists) {
        ensureBeneficiaryProfile(currentUser.id, currentUser.name);
      }
    }
  }, [currentUser, beneficiaries, ensureBeneficiaryProfile]);

  const profile = beneficiaries.find(b => b.userId === currentUser?.id);
  
  if (!profile && currentUser) return <div className="p-10 text-center">{t('common.loading')}</div>;
  if (!profile) return null;

  const insights = profile.lastPeriodDate 
    ? calculateCycleInsights(profile.lastPeriodDate) 
    : null;

  const isProfileIncomplete = !profile.weight || !profile.height || !profile.bloodGroup;
  const myChildren = children.filter(c => c.beneficiaryId === profile.id);

  // Get Active Enrollments
  const myEnrollments = enrollments
    .filter(e => e.beneficiaryId === profile.id && e.status === 'active')
    .map(e => schemes.find(s => s.id === e.schemeId))
    .filter(Boolean);

  const renderStatusCard = () => {
    if (!insights) {
      return (
        <div 
          onClick={() => navigate('/beneficiary/tracker')}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#FF8095] p-8 text-white shadow-sm cursor-pointer hover:scale-[1.01] transition-transform"
        >
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-widest uppercase opacity-80 mb-4">Get Started</p>
            <h2 className="text-3xl font-black mb-2">{t('dash.setup')}</h2>
            <p className="font-medium opacity-90 text-lg">{t('dash.setup_desc')}</p>
          </div>
          <div className="absolute right-4 bottom-4 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
             <Calendar className="w-8 h-8" />
          </div>
        </div>
      );
    }

    if (profile.userType === 'girl') {
      return (
        <div 
          onClick={() => navigate('/beneficiary/tracker')}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#FF8095] p-8 text-white shadow-sm cursor-pointer hover:scale-[1.01] transition-transform"
        >
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-widest uppercase opacity-80 mb-4">Cycle Status</p>
            <h2 className="text-5xl font-black mb-2">{insights.daysToNextPeriod} Days</h2>
            <p className="font-medium opacity-90 text-lg">to next period ({insights.nextPeriod})</p>
          </div>
          <div className="absolute right-6 bottom-6 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
             <Heart className="w-8 h-8 fill-current" />
          </div>
        </div>
      );
    }

    if (profile.userType === 'pregnant') {
      return (
        <div 
          onClick={() => navigate('/beneficiary/tracker')}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#C084FC] p-8 text-white shadow-sm cursor-pointer hover:scale-[1.01] transition-transform"
        >
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-widest uppercase opacity-80 mb-4">Pregnancy Progress</p>
            <h2 className="text-5xl font-black mb-2">{insights.pregnancyWeek} Weeks</h2>
            <p className="font-medium opacity-90 text-lg">Due Date: {insights.edd}</p>
          </div>
          <div className="absolute right-6 bottom-6 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
             <Baby className="w-8 h-8" />
          </div>
        </div>
      );
    }

    if (profile.userType === 'mother') {
      const nextVaccine = format(addDays(new Date(), 14), 'dd MMM');
      
      return (
        <div 
          onClick={() => navigate('/beneficiary/schemes')}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#4ADE80] p-8 text-slate-900 shadow-sm cursor-pointer hover:scale-[1.01] transition-transform"
        >
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-widest uppercase opacity-60 mb-4">Child Health</p>
            <h2 className="text-4xl font-black mb-2">Vaccine Due</h2>
            <p className="font-medium opacity-80 text-lg">Polio Dose 2 on {nextVaccine}</p>
          </div>
          <div className="absolute right-6 bottom-6 w-16 h-16 bg-black/10 backdrop-blur-sm rounded-full flex items-center justify-center">
             <Syringe className="w-8 h-8" />
          </div>
        </div>
      );
    }
  };

  const MenuCard = ({ title, icon: Icon, color, onClick, subtext }: any) => (
    <div 
      onClick={onClick}
      className={`p-6 rounded-[2.5rem] ${color} text-slate-900 cursor-pointer transition-transform hover:-translate-y-1 shadow-sm relative overflow-hidden group`}
    >
      <div className="flex justify-between items-start mb-8">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black">
          <Icon className="w-6 h-6" />
        </div>
        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight size={20} />
        </div>
      </div>
      
      <div>
        <p className="text-xs font-bold tracking-widest opacity-60 uppercase mb-2">{subtext}</p>
        <h3 className="text-2xl font-bold leading-tight">{title}</h3>
      </div>
    </div>
  );

  return (
    <RoleLayout role="beneficiary" title={`${t('dash.welcome')}, ${profile.name.split(' ')[0]}`}>
      <div className="space-y-6">
        
        {isProfileIncomplete && (
          <div 
            onClick={() => navigate('/beneficiary/card')}
            className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-lg shadow-indigo-200 cursor-pointer hover:scale-[1.01] transition-transform flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{t('dash.complete_profile')}</h3>
              <p className="text-indigo-100 text-sm">{t('dash.complete_profile_desc')}</p>
            </div>
            <div className="bg-white text-indigo-600 px-4 py-2 rounded-full text-xs font-bold">
              {t('dash.update')}
            </div>
          </div>
        )}

        {renderStatusCard()}

        {/* Active Schemes Widget */}
        {myEnrollments.length > 0 && (
          <div 
            onClick={() => navigate('/beneficiary/schemes')}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer hover:border-green-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-green-600 w-5 h-5" /> Active Benefits
              </h3>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                {myEnrollments.length} Active
              </span>
            </div>
            <div className="space-y-3">
              {myEnrollments.slice(0, 2).map((scheme: any) => (
                <div key={scheme.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <img src={scheme.heroImage} className="w-10 h-10 rounded-lg object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{scheme.title}</p>
                    <p className="text-xs text-slate-500 truncate">{scheme.provider}</p>
                  </div>
                </div>
              ))}
              {myEnrollments.length > 2 && (
                <p className="text-center text-xs text-slate-400 font-bold">
                  + {myEnrollments.length - 2} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Children's Health Section (For Mothers) */}
        {profile.userType === 'mother' && myChildren.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">My Children</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {myChildren.map(child => (
                <GlassCard key={child.id} className="p-4 min-w-[200px] flex items-center gap-3 bg-blue-50 border-blue-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">
                    {child.gender === 'female' ? '👧' : '👦'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{child.name}</h4>
                    <p className="text-xs text-slate-500">Healthy</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        )}

        {/* Medications Reminder (If any) */}
        {profile.currentMedications && (
          <GlassCard className="p-5 bg-yellow-50 border-yellow-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 shrink-0">
                <Stethoscope size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Medications</h3>
                <p className="text-sm text-slate-600 mt-1">{profile.currentMedications}</p>
              </div>
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl text-slate-900">{t('dash.ifa')}</h3>
            <p className="text-slate-500 font-medium">{t('dash.ifa_desc')}</p>
          </div>
          <button 
            onClick={() => setIfaTaken(!ifaTaken)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${ifaTaken ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}
          >
            <Pill size={24} />
          </button>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MenuCard 
            title={t('menu.benefits')} 
            subtext={t('menu.benefits_sub')}
            icon={Gift} 
            color="bg-[#E0E7FF]" 
            onClick={() => navigate('/beneficiary/schemes')} 
          />
          <MenuCard 
            title={t('menu.nutrition')} 
            subtext={t('menu.nutrition_sub')}
            icon={Apple} 
            color="bg-[#CCFBF1]" 
            onClick={() => navigate('/beneficiary/nutrition')} 
          />
          <MenuCard 
            title={t('menu.education')} 
            subtext={t('menu.education_sub')}
            icon={BookOpen} 
            color="bg-[#FEF3C7]" 
            onClick={() => navigate('/beneficiary/education')} 
          />
           <MenuCard 
            title={t('menu.card')} 
            subtext={t('menu.card_sub')}
            icon={QrCode} 
            color="bg-slate-100" 
            onClick={() => navigate('/beneficiary/card')} 
          />
        </div>

        <section className="pt-4 pb-20">
          <h2 className="text-lg font-bold text-slate-900 mb-4 text-center">{t('dash.emergency')}</h2>
          <SOSButton beneficiaryId={profile.id} />
        </section>
      </div>
    </RoleLayout>
  );
}
