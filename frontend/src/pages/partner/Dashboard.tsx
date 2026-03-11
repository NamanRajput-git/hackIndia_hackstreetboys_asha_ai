import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Plus, Users, FileText, ArrowUpRight, Baby } from 'lucide-react';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTranslation } from '../../hooks/useTranslation';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { beneficiaries, schemes, children } = useStore();
  const { t } = useTranslation();

  // Risk Data
  const riskData = [
    { name: 'High Risk', value: beneficiaries.filter(b => b.riskLevel === 'high').length },
    { name: 'Medium Risk', value: beneficiaries.filter(b => b.riskLevel === 'medium').length },
    { name: 'Low Risk', value: beneficiaries.filter(b => b.riskLevel === 'low').length },
  ];
  const RISK_COLORS = ['#ef4444', '#f97316', '#22c55e'];

  // Anemia Data
  const anemiaData = [
    { name: 'Severe', value: beneficiaries.filter(b => b.anemiaStatus === 'severe').length },
    { name: 'Moderate', value: beneficiaries.filter(b => b.anemiaStatus === 'moderate').length },
    { name: 'Mild', value: beneficiaries.filter(b => b.anemiaStatus === 'mild').length },
    { name: 'Normal', value: beneficiaries.filter(b => !b.anemiaStatus || b.anemiaStatus === 'normal').length },
  ];
  const ANEMIA_COLORS = ['#b91c1c', '#ea580c', '#facc15', '#22c55e'];

  const totalEnrolled = schemes.reduce((acc, s) => {
    const count = Number(s.enrolledCount);
    return acc + (isNaN(count) ? 0 : count);
  }, 0);

  const StatBlock = ({ label, value, color, icon: Icon }: any) => (
    <div className={`p-6 rounded-[2rem] ${color} h-full flex flex-col justify-between`}>
      <div className="flex justify-between items-start">
        <div className="p-3 bg-white/50 rounded-xl backdrop-blur-sm">
          <Icon size={20} className="text-slate-900" />
        </div>
      </div>
      <div>
        <h3 className="text-4xl font-black text-slate-900 mb-1">{value}</h3>
        <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );

  return (
    <RoleLayout role="partner" title={t('partner.dashboard')}>
      <div className="space-y-8">
        
        <div className="bg-[#C084FC] p-10 rounded-[2.5rem] text-slate-900 relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-widest opacity-60 mb-4 uppercase">{t('partner.campaigns')}</p>
            <h2 className="text-4xl font-black mb-4 leading-tight">{t('partner.launch_monitor')}</h2>
            <button 
              onClick={() => navigate('/partner/schemes/create')} 
              className="mt-4 px-6 py-3 bg-black text-white rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-5 h-5" /> {t('partner.launch_scheme')}
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatBlock label={t('nav.patients')} value={beneficiaries.length} color="bg-[#E0E7FF]" icon={Users} />
          <StatBlock label={t('partner.active_schemes')} value={schemes.filter(s => s.status === 'active').length} color="bg-[#CCFBF1]" icon={FileText} />
          <StatBlock label={t('partner.total_enrolled')} value={totalEnrolled} color="bg-[#FEF3C7]" icon={Users} />
          <StatBlock label={t('partner.child_stats')} value={children.length} color="bg-[#FFE4E6]" icon={Baby} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Chart */}
          <GlassCard className="p-8 h-[450px]">
            <h3 className="font-bold text-xl text-slate-900 mb-8">{t('partner.pop_risk')}</h3>
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 text-sm font-medium text-slate-600">
              {riskData.map((entry, index) => (
                 <span key={entry.name} className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_COLORS[index] }}></div> 
                   {entry.name}
                 </span>
              ))}
            </div>
          </GlassCard>

          {/* Anemia Chart */}
          <GlassCard className="p-8 h-[450px]">
            <h3 className="font-bold text-xl text-slate-900 mb-8">{t('partner.anemia_stats')}</h3>
            <ResponsiveContainer width="100%" height="75%">
              <BarChart data={anemiaData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={30}>
                  {anemiaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ANEMIA_COLORS[index % ANEMIA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="text-center text-sm text-slate-500 mt-4">
              Distribution of Anemia Severity among Beneficiaries
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <GlassCard className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-xl text-slate-900">{t('partner.top_schemes')}</h3>
              <button onClick={() => navigate('/partner/schemes')} className="text-sm text-indigo-600 font-bold uppercase tracking-wide">{t('common.view_all')}</button>
            </div>
            <div className="space-y-4">
              {schemes.sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0)).slice(0, 4).map(scheme => (
                <div key={scheme.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate(`/partner/schemes/${scheme.id}`)}>
                  <img src={scheme.heroImage} alt={scheme.title} className="w-16 h-16 object-cover rounded-xl" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-base">{scheme.title}</h4>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-1">{scheme.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 text-lg">{isNaN(Number(scheme.enrolledCount)) ? 0 : scheme.enrolledCount}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{t('schemes.enrolled')}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </RoleLayout>
  );
}
