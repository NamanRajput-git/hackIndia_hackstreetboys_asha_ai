import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronRight, User, Baby, UserPlus, Flower2, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { beneficiaryService } from '../../services';
import { BeneficiaryProfile } from '../../types';

export default function PatientList() {
  const { beneficiaries: storeBeneficiaries, fetchInitialData } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [localBeneficiaries, setLocalBeneficiaries] = useState<BeneficiaryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch beneficiaries on mount and when store is empty
  useEffect(() => {
    const loadBeneficiaries = async () => {
      // First try from store
      if (storeBeneficiaries.length > 0) {
        setLocalBeneficiaries(storeBeneficiaries);
        setLoading(false);
        return;
      }

      // Fallback: fetch directly from API
      setLoading(true);
      setError(null);
      try {
        const data = await beneficiaryService.list();
        console.log('[PatientList] Fetched beneficiaries:', data.length);
        setLocalBeneficiaries(data);

        // Also try to refresh store
        fetchInitialData(true);
      } catch (err) {
        console.error('[PatientList] Error loading beneficiaries:', err);
        setError('Failed to load patients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadBeneficiaries();
  }, [storeBeneficiaries, fetchInitialData]);

  // Refresh function
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await beneficiaryService.list();
      setLocalBeneficiaries(data);
      fetchInitialData(true);
    } catch (err) {
      console.error('[PatientList] Refresh error:', err);
      setError('Failed to refresh. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use local beneficiaries (from API) instead of just store
  const beneficiaries = localBeneficiaries.length > 0 ? localBeneficiaries : storeBeneficiaries;

  // Enhanced Filter: Matches Name OR ID (start)
  const filtered = beneficiaries.filter(b => {
    const query = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(query) ||
      b.id.toLowerCase().startsWith(query)
    );
  });

  const getPatientIcon = (type: string) => {
    switch (type) {
      case 'mother': return <Baby size={20} />;
      case 'pregnant': return <UserPlus size={20} />;
      case 'girl': return <Flower2 size={20} />;
      default: return <User size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white sticky top-0 z-10 border-b shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="font-bold text-lg text-slate-800 flex-1">
            {t('asha.patients_total')} ({beneficiaries.length})
          </h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Name or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-teal-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-2" />
            <p className="text-slate-500">Loading patients...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-red-500 font-medium mb-2">{error}</p>
            <button
              onClick={handleRefresh}
              className="text-teal-600 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-10">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">
              {beneficiaries.length === 0
                ? 'No patients registered yet.'
                : 'No patients found matching your search.'}
            </p>
            {beneficiaries.length === 0 && (
              <button
                onClick={() => navigate('/asha/register-patient')}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Register First Patient
              </button>
            )}
          </div>
        )}

        {/* Patient List */}
        {!loading && !error && filtered.map(patient => (
          <div
            key={patient.id}
            onClick={() => navigate(`/asha/patient/${patient.id}`)}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm ${patient.riskLevel === 'high' ? 'bg-red-500' :
                  patient.riskLevel === 'medium' ? 'bg-orange-500' :
                    'bg-green-500'
                }`}>
                {getPatientIcon(patient.userType)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{patient.name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="capitalize">
                    {patient.pregnancyStage ? patient.pregnancyStage.replace('_', ' ') : patient.userType}
                  </span>
                  <span className="text-xs bg-slate-100 px-1.5 rounded text-slate-400">
                    ID: {patient.id.slice(0, 4)}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
