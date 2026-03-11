import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, Search, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import AshaVoiceRecorder from '../../components/AshaVoiceRecorder';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { useToast } from '../../store/useToast';

export default function VisitForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('patientId');
  const { t } = useTranslation();
  const { beneficiaries, addHealthLog, fetchInitialData } = useStore();
  const { addToast } = useToast();

  const [selectedPatientId, setSelectedPatientId] = useState(preSelectedId || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Ensure data is loaded
  useEffect(() => {
    if (beneficiaries.length === 0) {
      fetchInitialData();
    }
  }, [beneficiaries.length, fetchInitialData]);

  // Update selection if URL param changes
  useEffect(() => {
    if (preSelectedId) {
      setSelectedPatientId(preSelectedId);
    }
  }, [preSelectedId]);

  const selectedPatient = beneficiaries.find(b => b.id === selectedPatientId);

  // Filter for search
  const filteredBeneficiaries = beneficiaries.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.abhaId && b.abhaId.includes(searchTerm))
  );

  const handleSave = async (data: any, transcript: string) => {
    if (!selectedPatientId) {
      addToast('Please select a patient first', 'error');
      return;
    }

    try {
      await addHealthLog({
        beneficiaryId: selectedPatientId,
        date: new Date().toISOString(),
        bpSystolic: data.vitals?.blood_pressure?.systolic || 0,
        bpDiastolic: data.vitals?.blood_pressure?.diastolic || 0,
        symptoms: data.symptoms || [],
        mood: data.mood || 'Neutral',
        isEmergency: data.follow_up_required || false,
      });

      // We don't save transcript directly in HealthLog interface currently, 
      // but maybe we should store notes.
      // Assuming HealthLog might be extended or we just save critical data.
      // DailyLog uses 'notes', HealthLog doesn't have 'notes' in interface (checked in Step 1250).
      // But typically we should save extraction.

      addToast('Visit recorded successfully', 'success');
      navigate('/asha');
    } catch (e) {
      console.error("Failed to save log", e);
      addToast('Failed to save visit record', 'error');
    }
  };

  const clearSelection = () => {
    setSelectedPatientId('');
    setSearchTerm('');
    // Update URL to remove patientId if present
    navigate('/asha/visit', { replace: true });
  };

  return (
    <RoleLayout role="asha_worker">
      <div className="bg-white p-4 border-b flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="font-bold text-lg text-slate-800">
          {selectedPatientId ? `Visit: ${selectedPatient?.name}` : t('asha.new_visit')}
        </h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto pb-24">
        {!selectedPatientId ? (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-teal-600 w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Select Patient</h2>
              <p className="text-slate-500 text-sm">Choose a beneficiary to record visit details</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or ABHA ID..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {filteredBeneficiaries.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedPatientId(b.id)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${b.riskLevel === 'high' ? 'bg-red-100 text-red-600' :
                          b.riskLevel === 'medium' ? 'bg-orange-100 text-orange-600' :
                            'bg-teal-100 text-teal-600'
                        }`}>
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-teal-700">{b.name}</h3>
                        <p className="text-xs text-slate-500 capitalize">{b.userType} • {b.age}y</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-700">
                      Select
                    </div>
                  </div>
                ))}

                {filteredBeneficiaries.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    No patients found
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Patient Banner */}
            <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-teal-700 font-bold border border-teal-100">
                  {selectedPatient?.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-teal-600 font-bold uppercase">Recording for</p>
                  <h3 className="font-bold text-teal-900">{selectedPatient?.name}</h3>
                </div>
              </div>
              <button
                onClick={clearSelection}
                className="p-2 bg-white text-slate-500 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {/* The Voice Recorder Component */}
            <AshaVoiceRecorder
              patientName={selectedPatient?.name}
              patientId={selectedPatientId}
              onSave={handleSave}
              onCancel={() => navigate(-1)}
            />
          </div>
        )}
      </div>
    </RoleLayout>
  );
}
