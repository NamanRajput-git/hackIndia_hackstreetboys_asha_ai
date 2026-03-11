import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Search, Trash2, Eye, Users, IndianRupee, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { useTranslation } from '../../hooks/useTranslation';

export default function SchemesList() {
  const navigate = useNavigate();
  const { schemes, deleteScheme } = useStore();
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');

  const filteredSchemes = schemes.filter(s => filter === 'all' || s.status === filter);

  return (
    <RoleLayout role="partner" title={t('partner.manage')}>
      <div className="space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-full w-full md:w-auto">
            {['all', 'active', 'draft', 'closed'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-2 rounded-full text-sm font-bold capitalize transition-all ${
                  filter === status 
                    ? 'bg-black text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <Button onClick={() => navigate('/partner/schemes/create')} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 rounded-full px-8">
            <Plus className="w-5 h-5 mr-2" /> {t('partner.launch_scheme')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredSchemes.map(scheme => (
            <div 
              key={scheme.id} 
              className="group bg-white rounded-[2.5rem] p-4 pr-6 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-slate-100 hover:shadow-md transition-all hover:border-indigo-100"
            >
              <div className="w-full md:w-48 h-48 md:h-32 rounded-[2rem] overflow-hidden shrink-0 relative">
                <img src={scheme.heroImage} alt={scheme.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                    scheme.status === 'active' ? 'bg-green-500/90 text-white' : 'bg-slate-500/90 text-white'
                  }`}>
                    {scheme.status}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0 text-center md:text-left">
                <h3 className="font-black text-xl text-slate-900 mb-2">{scheme.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 font-medium mb-4 max-w-2xl">{scheme.description}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Users size={14} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-400 uppercase">{t('schemes.enrolled')}</p>
                      <p className="font-bold text-slate-900">{isNaN(Number(scheme.enrolledCount)) ? 0 : scheme.enrolledCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <IndianRupee size={14} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-400 uppercase">{t('partner.budget')}</p>
                      <p className="font-bold text-slate-900">₹{((scheme.budget || 0) / 100000).toFixed(1)}L</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                <button 
                  onClick={() => navigate(`/partner/schemes/${scheme.id}`)}
                  className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} /> View
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/partner/schemes/edit/${scheme.id}`)}
                    className="flex-1 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center justify-center"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm('Are you sure you want to delete this scheme?')) deleteScheme(scheme.id);
                    }}
                    className="flex-1 px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RoleLayout>
  );
}
