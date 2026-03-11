import { useStore } from '../../store/useStore';
import { ArrowLeft, Search, ArrowUpRight, CheckCircle2, XCircle, AlertCircle, Info, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Scheme, BeneficiaryProfile } from '../../types';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { enrollmentService, schemeService } from '../../services';
import { useToast } from '../../store/useToast';

export default function BeneficiarySchemes() {
  const { schemes: storeSchemes, currentUser, beneficiaries, enrollments, fetchInitialData } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'financial' | 'nutrition'>('all');
  const [checkingScheme, setCheckScheme] = useState<Scheme | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [localSchemes, setLocalSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch schemes on mount
  useEffect(() => {
    const loadSchemes = async () => {
      if (storeSchemes.length > 0) {
        setLocalSchemes(storeSchemes);
        setLoading(false);
        return;
      }

      try {
        const schemes = await schemeService.getActive();
        setLocalSchemes(schemes);
      } catch (err) {
        console.error('Failed to load schemes:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSchemes();
  }, [storeSchemes]);

  const schemes = localSchemes.length > 0 ? localSchemes : storeSchemes;

  const profile = beneficiaries.find(b => b.userId === currentUser?.id);

  // Helper to check if user is enrolled
  const isEnrolled = (schemeId: string) => {
    return profile && enrollments.some(e => e.schemeId === schemeId && e.beneficiaryId === profile.id && e.status === 'active');
  };

  const relevantSchemes = schemes.filter(s => {
    // FIX: Show scheme if user is enrolled, EVEN IF it's draft/closed
    if (isEnrolled(s.id)) return true;

    // Otherwise, only show active schemes
    if (s.status !== 'active') return false;

    if (filter !== 'all' && s.category !== filter) return false;
    if (!profile) return true;

    const audience = s.targetAudience || {};

    // 1. User Type Match (Priority)
    if (audience.userTypes && audience.userTypes.length > 0) {
      if (!audience.userTypes.includes(profile.userType)) return false;
    }

    // 2. Pregnancy Stage Match (Secondary)
    if (audience.pregnancyStage && audience.pregnancyStage.length > 0) {
      if (profile.userType === 'girl') {
        if (!audience.userTypes || !audience.userTypes.includes('girl')) return false;
      } else {
        const userStage = profile.userType === 'mother' ? 'postpartum' : profile.pregnancyStage;
        if (userStage && !audience.pregnancyStage.includes(userStage)) {
          const schemeHasTrimesters = audience.pregnancyStage.some(st => st.includes('trimester'));
          if (profile.userType === 'pregnant' && schemeHasTrimesters) {
            // Keep it
          } else {
            return false;
          }
        }
      }
    }

    return true;
  });

  const enrolledSchemes = relevantSchemes.filter(s => isEnrolled(s.id));
  const availableSchemes = relevantSchemes.filter(s => !isEnrolled(s.id));

  const checkEligibility = (scheme: Scheme, userProfile: BeneficiaryProfile) => {
    const criteria = [];
    let isEligible = true;
    const fmt = (s: string) => s.replace('_', ' ').toUpperCase();

    if (scheme.targetAudience?.economicStatus?.length) {
      const userEco = userProfile.economicStatus || 'apl';
      const met = scheme.targetAudience.economicStatus.includes(userEco);

      criteria.push({
        label: 'Economic Status',
        required: scheme.targetAudience.economicStatus.join(' / ').toUpperCase(),
        actual: userEco.toUpperCase(),
        met
      });
      if (!met) isEligible = false;
    }

    if (scheme.targetAudience?.pregnancyStage?.length) {
      let userStage = userProfile.pregnancyStage as string;
      if (userProfile.userType === 'mother') userStage = 'postpartum';

      if (userProfile.userType !== 'girl') {
        const met = userStage
          ? scheme.targetAudience.pregnancyStage.includes(userStage)
          : (userProfile.userType === 'pregnant' && scheme.targetAudience.pregnancyStage.some(s => s.includes('trimester')));

        criteria.push({
          label: 'Life Stage',
          required: scheme.targetAudience.pregnancyStage.map(s => fmt(s)).join(', '),
          actual: userStage ? fmt(userStage) : fmt(userProfile.userType),
          met
        });
        if (!met) isEligible = false;
      }
    }

    if (scheme.targetAudience?.riskLevel?.length) {
      const userRisk = userProfile.riskLevel || 'low';
      const met = scheme.targetAudience.riskLevel.includes(userRisk);

      criteria.push({
        label: 'Health Risk',
        required: scheme.targetAudience.riskLevel.map(s => fmt(s)).join(', '),
        actual: fmt(userRisk),
        met
      });
      if (!met) isEligible = false;
    }

    return { isEligible, criteria };
  };

  const SchemeCard = ({ scheme, enrolled = false }: { scheme: Scheme, enrolled?: boolean }) => {
    const eligibility = profile ? checkEligibility(scheme, profile) : { isEligible: false, criteria: [] };

    return (
      <div
        onClick={() => !enrolled && setCheckScheme(scheme)}
        className={`bg-white p-6 rounded-[2.5rem] shadow-sm border flex flex-col md:flex-row gap-6 group transition-all cursor-pointer relative overflow-hidden ${enrolled ? 'border-green-200 bg-green-50/30' : 'border-slate-100 hover:shadow-md'
          }`}
      >
        <div className="w-full md:w-32 h-32 rounded-[2rem] bg-slate-50 shrink-0 overflow-hidden relative">
          <img src={scheme.heroImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {enrolled && (
            <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center">
              <div className="bg-white rounded-full p-2">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${scheme.category === 'financial' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                  {scheme.category}
                </span>
                {enrolled ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-600 text-white flex items-center gap-1">
                    <CheckCircle2 size={10} /> Enrolled
                  </span>
                ) : (
                  profile && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 ${eligibility.isEligible ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {eligibility.isEligible ? <CheckCircle2 size={10} /> : <Info size={10} />}
                      {eligibility.isEligible ? t('schemes.eligible') : t('schemes.check_criteria')}
                    </span>
                  )
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">{scheme.title}</h3>
            </div>
            {!enrolled && (
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <ArrowUpRight size={20} />
              </div>
            )}
          </div>
          <p className="text-slate-500 font-medium text-sm line-clamp-2 mb-4">
            {scheme.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {(scheme.benefits || []).slice(0, 2).map((benefit, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full">
                <CheckCircle2 size={12} className="text-teal-500" /> {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">{t('schemes.title')}</h1>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-full">
          <Search size={24} className="text-slate-800" />
        </button>
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-8">

        {/* Hero Section */}
        <div className="bg-[#E0E7FF] p-8 rounded-[2.5rem] relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-xs">
            <p className="text-xs font-bold tracking-widest opacity-60 uppercase mb-3">{t('schemes.featured')}</p>
            <h2 className="text-3xl font-black text-slate-900 mb-4 leading-tight">
              {t('schemes.hero_title')}
            </h2>
            <p className="text-slate-700 font-medium mb-6">
              {t('schemes.hero_desc')}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['all', 'financial', 'nutrition'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-6 py-3 rounded-full text-sm font-bold capitalize transition-all whitespace-nowrap ${filter === t
                ? 'bg-black text-white shadow-md'
                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Enrolled Schemes Section */}
        {enrolledSchemes.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 px-2 flex items-center gap-2">
              <CheckCircle2 className="text-green-600" size={20} /> My Active Schemes
            </h3>
            <div className="space-y-4">
              {enrolledSchemes.map(scheme => (
                <SchemeCard key={scheme.id} scheme={scheme} enrolled={true} />
              ))}
            </div>
          </section>
        )}

        {/* Available Schemes Section */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">Available for You</h3>
          <div className="space-y-4">
            {availableSchemes.length > 0 ? (
              availableSchemes.map(scheme => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No new schemes found matching your profile.</p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Eligibility Modal */}
      <AnimatePresence>
        {checkingScheme && profile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{checkingScheme.title}</h2>
                  <p className="text-slate-400 text-sm mt-1">Eligibility Check</p>
                </div>
                <button
                  onClick={() => setCheckScheme(null)}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {(() => {
                  const { isEligible, criteria } = checkEligibility(checkingScheme, profile);
                  return (
                    <>
                      <div className={`p-4 rounded-xl flex items-center gap-3 mb-6 ${isEligible ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                        }`}>
                        {isEligible ? (
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        ) : (
                          <AlertCircle className="w-8 h-8 text-red-600" />
                        )}
                        <div>
                          <h3 className={`font-bold ${isEligible ? 'text-green-800' : 'text-red-800'}`}>
                            {isEligible ? t('schemes.eligible') : t('schemes.not_eligible')}
                          </h3>
                          <p className={`text-xs ${isEligible ? 'text-green-600' : 'text-red-600'}`}>
                            {isEligible ? 'You meet all the criteria.' : 'Review the missing criteria below.'}
                          </p>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('schemes.criteria_checklist')}</h3>

                      <div className="space-y-3">
                        {criteria.map((c, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            {c.met ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{c.label}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-slate-500">{t('schemes.required')}: {c.required}</span>
                                <span className={`text-xs font-bold ${c.met ? 'text-green-600' : 'text-red-500'}`}>
                                  {t('schemes.you')}: {c.actual}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8">
                        {isEligible ? (
                          <button
                            onClick={async () => {
                              if (!profile || !checkingScheme) return;

                              setEnrolling(true);
                              try {
                                await enrollmentService.enroll(checkingScheme.id, profile.id);
                                addToast('योजना में सफलतापूर्वक नामांकित! (Successfully enrolled!)', 'success');
                                await fetchInitialData(true); // Refresh data
                                setCheckScheme(null);
                              } catch (error: any) {
                                console.error('Enrollment failed:', error);
                                addToast(error.response?.data?.detail || 'Enrollment failed. Please try again.', 'error');
                              } finally {
                                setEnrolling(false);
                              }
                            }}
                            disabled={enrolling}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {enrolling ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Enrolling...
                              </>
                            ) : (
                              t('schemes.apply')
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/beneficiary/card')}
                            className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-lg hover:bg-slate-200"
                          >
                            {t('dash.update')}
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

