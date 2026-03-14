import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { authService } from '../../services';
import { User as UserType } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') as UserType['role'] || 'beneficiary';
  const { login, currentUser, fetchInitialData, ensureBeneficiaryProfile } = useStore();
  const { addToast } = useToast();
  const { t } = useTranslation();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'beneficiary') navigate('/beneficiary');
      else if (currentUser.role === 'asha_worker') navigate('/asha');
      else navigate('/partner');
    }
  }, [currentUser, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginMode) {
        // Login
        const { user } = await authService.login({
          email: formData.email,
          password: formData.password
        });

        login(user as UserType);
        addToast(t('common.success'), 'success');

        // Navigate immediately — don't block on data fetch
        if (user.role === 'beneficiary') navigate('/beneficiary');
        else if (user.role === 'asha_worker') navigate('/asha');
        else navigate('/partner');

        // Fetch data in background (non-blocking)
        fetchInitialData();

      } else {
        // Sign Up
        const newUser = await authService.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.name,
          role: role
        });

        // Now login with the new credentials
        const { user } = await authService.login({
          email: formData.email,
          password: formData.password
        });

        login(user as UserType);

        // Create beneficiary profile if needed
        if (role === 'beneficiary') {
          await ensureBeneficiaryProfile(user.id, formData.name);
        }

        addToast(t('common.success'), 'success');

        // Navigate immediately — don't block on data fetch
        if (role === 'beneficiary') navigate('/beneficiary');
        else if (role === 'asha_worker') navigate('/asha');
        else navigate('/partner');

        // Fetch data in background (non-blocking)
        fetchInitialData();
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      const message = error.response?.data?.detail || error.message || t('common.error');
      addToast(message, 'error');
      authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabels = {
    beneficiary: { title: t('auth.beneficiary'), color: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-50' },
    asha_worker: { title: t('auth.asha'), color: 'bg-teal-600', text: 'text-teal-600', light: 'bg-teal-50' },
    partner: { title: t('auth.partner'), color: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50' }
  };

  const currentRole = roleLabels[role];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">

        <button
          onClick={() => navigate('/role-select')}
          className="flex items-center text-slate-400 font-bold mb-8 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" /> {t('common.back')}
        </button>

        <div className="mb-8">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentRole.light} ${currentRole.text} mb-4 inline-block`}>
            {isLoginMode ? t('auth.welcome_back') : t('auth.create_account')}
          </span>
          <h1 className="text-4xl font-black mb-2 text-slate-900">{currentRole.title}</h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">

          {!isLoginMode && (
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
              <input
                type="text"
                required
                placeholder={t('auth.fullname')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-black focus:outline-none font-bold text-slate-900 transition-colors placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            <input
              type="email"
              required
              placeholder={t('auth.email')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-black focus:outline-none font-bold text-slate-900 transition-colors placeholder:text-slate-400"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            <input
              type="password"
              required
              placeholder={t('auth.password')}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-black focus:outline-none font-bold text-slate-900 transition-colors placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${currentRole.color} hover:opacity-90 mt-4 shadow-lg`}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (
              <>
                {isLoginMode ? t('auth.login') : t('auth.signup')} <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-slate-500 font-medium hover:text-black transition-colors"
          >
            {isLoginMode ? t('auth.dont_have_account') : t('auth.already_have_account')}
            <span className={`font-bold underline ${currentRole.text} ml-1`}>
              {isLoginMode ? t('auth.signup') : t('auth.login')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
