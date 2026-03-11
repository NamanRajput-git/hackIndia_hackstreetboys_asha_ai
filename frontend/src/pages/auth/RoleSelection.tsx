import { useNavigate } from 'react-router-dom';
import { UserCircle2, Stethoscope, Building2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSelectRole = (role: string) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 flex flex-col items-center justify-center">
      
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{t('auth.who_are_you')}</h1>
          <p className="text-xl text-slate-500 font-medium">{t('auth.select_role')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Beneficiary */}
          <motion.button
            whileHover={{ y: -10 }}
            onClick={() => handleSelectRole('beneficiary')}
            className="bg-[#FFE4E6] p-8 rounded-[2.5rem] text-left h-80 flex flex-col justify-between group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-500 mb-6">
              <UserCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">{t('auth.beneficiary')}</h3>
              <p className="font-medium opacity-70">{t('auth.beneficiary_desc')}</p>
            </div>
            <div className="flex justify-end">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={24} />
              </div>
            </div>
          </motion.button>

          {/* ASHA Worker */}
          <motion.button
            whileHover={{ y: -10 }}
            onClick={() => handleSelectRole('asha_worker')}
            className="bg-[#CCFBF1] p-8 rounded-[2.5rem] text-left h-80 flex flex-col justify-between group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-teal-600 mb-6">
              <Stethoscope size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">{t('auth.asha')}</h3>
              <p className="font-medium opacity-70">{t('auth.asha_desc')}</p>
            </div>
            <div className="flex justify-end">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={24} />
              </div>
            </div>
          </motion.button>

          {/* Partner */}
          <motion.button
            whileHover={{ y: -10 }}
            onClick={() => handleSelectRole('partner')}
            className="bg-[#E0E7FF] p-8 rounded-[2.5rem] text-left h-80 flex flex-col justify-between group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
              <Building2 size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">{t('auth.partner')}</h3>
              <p className="font-medium opacity-70">{t('auth.partner_desc')}</p>
            </div>
            <div className="flex justify-end">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={24} />
              </div>
            </div>
          </motion.button>

        </div>

        <button 
          onClick={() => navigate('/')}
          className="mt-12 mx-auto block text-slate-400 font-bold hover:text-black transition-colors"
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  );
}
