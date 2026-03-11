import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Users, IndianRupee, Calendar, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../../hooks/useTranslation';

export default function SchemeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { schemes, enrollments, beneficiaries } = useStore();
  const { t } = useTranslation();
  
  const scheme = schemes.find(s => s.id === id);
  const schemeEnrollments = enrollments.filter(e => e.schemeId === id);

  if (!scheme) return <div>Scheme not found</div>;

  const enrollmentData = [
    { name: 'Week 1', value: 12 },
    { name: 'Week 2', value: 45 },
    { name: 'Week 3', value: 32 },
    { name: 'Week 4', value: 60 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate('/partner/schemes')} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Campaign Dashboard</h1>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
          <img src={scheme.heroImage} alt={scheme.title} className="w-full md:w-64 h-40 object-cover rounded-xl" />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{scheme.title}</h2>
                <p className="text-slate-500 mt-1">{scheme.description}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold uppercase">
                {scheme.status}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400">{t('schemes.enrolled')}</p>
                  <p className="font-bold">{isNaN(Number(scheme.enrolledCount)) ? 0 : scheme.enrolledCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <IndianRupee className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400">{t('partner.budget')}</p>
                  <p className="font-bold">₹{((scheme.budget || 0) / 100000).toFixed(2)}L</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400">Launched</p>
                  <p className="font-bold">{scheme.startDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6">{t('partner.enrollment_trend')}</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">{t('partner.recent_beneficiaries')}</h3>
              <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-4">
              {schemeEnrollments.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No enrollments yet.</p>
              ) : (
                schemeEnrollments.slice(0, 5).map(enrollment => {
                  const user = beneficiaries.find(b => b.id === enrollment.beneficiaryId);
                  return (
                    <div key={enrollment.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {user?.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{user?.name}</p>
                        <p className="text-xs text-slate-500">Enrolled: {new Date(enrollment.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
