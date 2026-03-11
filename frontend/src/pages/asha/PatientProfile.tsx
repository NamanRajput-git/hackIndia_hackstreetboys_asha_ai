import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { ArrowLeft, Phone, MapPin, AlertTriangle, Activity, CheckCircle2, HeartPulse, Baby, Edit2, Save, Plus, X, Trash2, QrCode, User, UserPlus, Flower2, Navigation } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { BeneficiaryProfile, Child } from '../../types';
import { clsx } from 'clsx';
import VaccinationTracker from '../../components/beneficiary/VaccinationTracker';
import DigitalHealthCard from '../../components/beneficiary/DigitalHealthCard';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { beneficiaries, healthLogs, schemes, enrollments, enrollBeneficiary, currentUser, updateBeneficiaryProfile, children, addChild, updateChild, deleteBeneficiary } = useStore();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'history' | 'schemes' | 'medical' | 'family' | 'pregnancy'>('history');
  const [editMode, setEditMode] = useState<'none' | 'basic' | 'medical' | 'child'>('none');
  const [formData, setFormData] = useState<Partial<BeneficiaryProfile>>({});
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childFormData, setChildFormData] = useState<Partial<Child>>({ gender: 'male' });
  const [showCard, setShowCard] = useState(false);

  // Robust Patient Lookup: Matches Full ID OR Starts With ID (for short IDs)
  const patient = beneficiaries.find(b => b.id === id || (id && b.id.startsWith(id)));

  // If we found a patient via partial ID, use the REAL ID for subsequent lookups
  const realId = patient?.id;

  const patientLogs = healthLogs.filter(l => l.beneficiaryId === realId);
  const patientChildren = children.filter(c => c.beneficiaryId === realId);

  if (!patient || !realId) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <User size={48} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Patient Not Found</h2>
        <p className="text-slate-500 mb-6">The patient ID you are looking for does not exist.</p>
        <Button onClick={() => navigate('/asha')} variant="outline">Back to Dashboard</Button>
      </div>
    </div>
  );

  const handleEnroll = async (schemeId: string) => {
    if (!currentUser) {
      addToast('You must be logged in to enroll patients', 'error');
      return;
    }
    try {
      await enrollBeneficiary(schemeId, realId, currentUser.id);
      addToast('Patient enrolled successfully!', 'success');
    } catch (error) {
      addToast('Failed to enroll patient', 'error');
    }
  };

  const startEditingBasic = () => {
    setFormData({
      name: patient.name,
      riskLevel: patient.riskLevel,
      userType: patient.userType,
      pregnancyStage: patient.pregnancyStage,
      nextCheckup: patient.nextCheckup,
      address: patient.address,
      gps_coords: patient.gps_coords
    });
    setEditMode('basic');
  };

  const startEditingMedical = () => {
    setFormData({
      medicalHistory: patient.medicalHistory,
      currentMedications: patient.currentMedications,
      complications: patient.complications,
      anemiaStatus: patient.anemiaStatus,
      weight: patient.weight,
      height: patient.height,
      bloodGroup: patient.bloodGroup
    });
    setEditMode('medical');
  };

  const handleSaveProfile = async () => {
    await updateBeneficiaryProfile(realId, formData);
    setEditMode('none');
    addToast('Profile updated successfully', 'success');
  };

  const handleDeleteUser = async () => {
    if (confirm(`Are you sure you want to delete ${patient.name}? This action cannot be undone.`)) {
      await deleteBeneficiary(realId);
      addToast('Patient deleted successfully', 'success');
      navigate('/asha/patients');
    }
  };

  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData({
          ...formData,
          gps_coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        });
        addToast('GPS Location Updated', 'success');
      }, (err) => {
        addToast('Location access denied', 'error');
      });
    } else {
      addToast('Geolocation not supported', 'error');
    }
  };

  const handleAddChild = async () => {
    if (childFormData.name && childFormData.dob) {
      await addChild({
        beneficiaryId: realId,
        name: childFormData.name,
        dob: childFormData.dob,
        gender: childFormData.gender as 'male' | 'female',
        bloodGroup: childFormData.bloodGroup,
        vaccinations: []
      });
      setIsAddingChild(false);
      setChildFormData({ gender: 'male' });
      addToast('Child added successfully', 'success');
    }
  };

  const startEditingChild = (child: Child) => {
    setChildFormData({
      name: child.name,
      dob: child.dob,
      gender: child.gender,
      bloodGroup: child.bloodGroup
    });
    setEditingChildId(child.id);
  };

  const handleUpdateChild = async () => {
    if (editingChildId && childFormData.name) {
      await updateChild(editingChildId, childFormData);
      setEditingChildId(null);
      setChildFormData({ gender: 'male' });
      addToast('Child updated successfully', 'success');
    }
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={clsx(
        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
        activeTab === id
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-white text-slate-500 hover:bg-slate-50"
      )}
    >
      <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/asha')} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="font-bold text-lg text-slate-800">{t('asha.patient_profile')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCard(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
            title="View Digital Card"
          >
            <QrCode size={16} />
            <span className="text-xs font-bold">Digital Card</span>
          </button>
          <button
            onClick={handleDeleteUser}
            className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
            title="Delete Patient"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <main className="p-4 space-y-6">

        {/* Basic Info Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative">
          <button
            onClick={() => editMode === 'basic' ? handleSaveProfile() : startEditingBasic()}
            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600"
          >
            {editMode === 'basic' ? <Save size={18} /> : <Edit2 size={18} />}
          </button>

          {editMode === 'basic' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg font-bold text-lg"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">User Type</label>
                  <select
                    className="w-full p-2 border rounded-lg text-sm"
                    value={formData.userType}
                    onChange={e => setFormData({ ...formData, userType: e.target.value as any })}
                  >
                    <option value="girl">Girl</option>
                    <option value="pregnant">Pregnant</option>
                    <option value="mother">Mother</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Risk Level</label>
                  <select
                    className="w-full p-2 border rounded-lg text-sm font-bold"
                    value={formData.riskLevel}
                    onChange={e => setFormData({ ...formData, riskLevel: e.target.value as any })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Pregnancy Stage</label>
                <select
                  className="w-full p-2 border rounded-lg text-sm"
                  value={formData.pregnancyStage || ''}
                  onChange={e => setFormData({ ...formData, pregnancyStage: e.target.value as any })}
                >
                  <option value="">Select Stage</option>
                  <option value="trimester_1">Trimester 1 (1-12 Weeks)</option>
                  <option value="trimester_2">Trimester 2 (13-26 Weeks)</option>
                  <option value="trimester_3">Trimester 3 (27+ Weeks)</option>
                  <option value="postpartum">Postpartum</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg text-sm"
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <button
                  onClick={handleGPS}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg w-full justify-center"
                >
                  <Navigation size={14} /> Update GPS Location
                </button>
                {formData.gps_coords && (
                  <p className="text-[10px] text-green-600 text-center font-bold mt-1">
                    GPS: {formData.gps_coords.lat.toFixed(4)}, {formData.gps_coords.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.name}`}
                alt={patient.name}
                className="w-16 h-16 rounded-full bg-slate-100"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${patient.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                    patient.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                    {patient.riskLevel} Risk
                  </div>
                </div>
                <p className="text-slate-500 text-sm capitalize flex items-center gap-1">
                  {patient.userType === 'mother' ? <Baby size={14} /> :
                    patient.userType === 'pregnant' ? <UserPlus size={14} /> :
                      <Flower2 size={14} />}
                  {patient.userType} • {patient.pregnancyStage?.replace('_', ' ') || 'N/A'}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                    <MapPin size={14} /> {patient.address || 'No Address'}
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    ID: {patient.id.slice(0, 8)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Next Checkup</p>
            <p className="font-bold text-rose-600">{patient.nextCheckup ? new Date(patient.nextCheckup).toLocaleDateString() : 'Not Scheduled'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Last Visit</p>
            <p className="font-bold text-slate-800">{patientLogs[patientLogs.length - 1] ? new Date(patientLogs[patientLogs.length - 1].date).toLocaleDateString() : 'Never'}</p>
          </div>
        </div>

        {/* Tabs - show Family tab only for mothers */}
        <div className="bg-slate-200 p-1 rounded-xl flex gap-1">
          <TabButton id="history" label="History" icon={Activity} />
          <TabButton id="medical" label="Medical" icon={HeartPulse} />
          {/* Family/Children tab - only for mothers */}
          {patient.userType === 'mother' && (
            <TabButton id="family" label="Children" icon={Baby} />
          )}
          {/* Pregnancy tab - only for pregnant women */}
          {patient.userType === 'pregnant' && (
            <TabButton id="pregnancy" label="Pregnancy" icon={UserPlus} />
          )}
          <TabButton id="schemes" label="Schemes" icon={CheckCircle2} />
        </div>

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <section className="space-y-4">
            <Button onClick={() => navigate(`/asha/visit?patientId=${realId}`)} className="w-full bg-teal-600 hover:bg-teal-700">
              <Activity className="w-4 h-4 mr-2" />
              {t('asha.new_visit')}
            </Button>

            {patientLogs.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 text-sm">No recent visits recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patientLogs.map(log => (
                  <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-400">{new Date(log.date).toLocaleDateString()}</span>
                      {log.isEmergency && <AlertTriangle size={14} className="text-red-500" />}
                    </div>
                    <p className="text-sm text-slate-700">
                      BP: <span className="font-bold">{log.bpSystolic}/{log.bpDiastolic}</span> • Mood: {log.mood}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {log.symptoms.map(s => (
                        <span key={s} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* --- MEDICAL TAB --- */}
        {activeTab === 'medical' && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Medical Details</h3>
              <button
                onClick={() => editMode === 'medical' ? handleSaveProfile() : startEditingMedical()}
                className="text-sm font-bold text-teal-600 flex items-center gap-1"
              >
                {editMode === 'medical' ? <Save size={16} /> : <Edit2 size={16} />}
                {editMode === 'medical' ? 'Save' : 'Edit'}
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Weight</label>
                  {editMode === 'medical' ? (
                    <input type="number" className="w-full bg-transparent font-bold" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })} />
                  ) : (
                    <p className="font-bold">{patient.weight || '-'} kg</p>
                  )}
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Height</label>
                  {editMode === 'medical' ? (
                    <input type="number" className="w-full bg-transparent font-bold" value={formData.height || ''} onChange={e => setFormData({ ...formData, height: Number(e.target.value) })} />
                  ) : (
                    <p className="font-bold">{patient.height || '-'} cm</p>
                  )}
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Blood</label>
                  {editMode === 'medical' ? (
                    <input type="text" className="w-full bg-transparent font-bold" value={formData.bloodGroup || ''} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })} />
                  ) : (
                    <p className="font-bold">{patient.bloodGroup || '-'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Anemia Status</label>
                {editMode === 'medical' ? (
                  <select
                    className="w-full mt-1 p-2 border rounded-lg text-sm"
                    value={formData.anemiaStatus}
                    onChange={e => setFormData({ ...formData, anemiaStatus: e.target.value as any })}
                  >
                    <option value="normal">Normal</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                ) : (
                  <div className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${patient.anemiaStatus === 'severe' ? 'bg-red-100 text-red-700' :
                    patient.anemiaStatus === 'moderate' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                    {patient.anemiaStatus || 'Normal'}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Medical History</label>
                {editMode === 'medical' ? (
                  <textarea
                    className="w-full mt-1 p-2 border rounded-lg text-sm"
                    value={formData.medicalHistory || ''}
                    onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-slate-800 mt-1">{patient.medicalHistory || 'None recorded'}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Current Medications</label>
                {editMode === 'medical' ? (
                  <textarea
                    className="w-full mt-1 p-2 border rounded-lg text-sm"
                    value={formData.currentMedications || ''}
                    onChange={e => setFormData({ ...formData, currentMedications: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-slate-800 mt-1">{patient.currentMedications || 'None'}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Complications</label>
                {editMode === 'medical' ? (
                  <textarea
                    className="w-full mt-1 p-2 border rounded-lg text-sm border-red-200 bg-red-50"
                    value={formData.complications || ''}
                    onChange={e => setFormData({ ...formData, complications: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-red-700 mt-1 font-medium">{patient.complications || 'None reported'}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* --- FAMILY TAB --- */}
        {activeTab === 'family' && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Children</h3>
              <button
                onClick={() => {
                  setIsAddingChild(!isAddingChild);
                  setEditingChildId(null);
                  setChildFormData({ gender: 'male' });
                }}
                className="text-sm font-bold text-teal-600 flex items-center gap-1"
              >
                {isAddingChild ? <X size={16} /> : <Plus size={16} />}
                {isAddingChild ? 'Cancel' : 'Add Child'}
              </button>
            </div>

            {/* Add/Edit Child Form */}
            {(isAddingChild || editingChildId) && (
              <div className="bg-slate-100 p-4 rounded-xl space-y-3 border border-slate-200 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-sm font-bold text-slate-700">{editingChildId ? 'Edit Child' : 'New Child Details'}</h4>
                <input
                  type="text"
                  placeholder="Child Name"
                  className="w-full p-2 rounded-lg text-sm"
                  value={childFormData.name || ''}
                  onChange={e => setChildFormData({ ...childFormData, name: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full p-2 rounded-lg text-sm"
                  value={childFormData.dob || ''}
                  onChange={e => setChildFormData({ ...childFormData, dob: e.target.value })}
                />
                <div className="flex gap-2">
                  <select
                    className="flex-1 p-2 rounded-lg text-sm"
                    value={childFormData.gender}
                    onChange={e => setChildFormData({ ...childFormData, gender: e.target.value as any })}
                  >
                    <option value="male">Boy</option>
                    <option value="female">Girl</option>
                  </select>
                  <select
                    className="flex-1 p-2 rounded-lg text-sm"
                    value={childFormData.bloodGroup || ''}
                    onChange={e => setChildFormData({ ...childFormData, bloodGroup: e.target.value })}
                  >
                    <option value="">Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => { setIsAddingChild(false); setEditingChildId(null); }} className="flex-1">Cancel</Button>
                  <Button size="sm" onClick={editingChildId ? handleUpdateChild : handleAddChild} className="flex-1">Save</Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {patientChildren.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No children recorded.</p>
              ) : (
                patientChildren.map(child => (
                  <div key={child.id} className="space-y-2">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${child.gender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'
                          }`}>
                          {child.gender === 'female' ? '👧' : '👦'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{child.name}</h4>
                          <p className="text-xs text-slate-500">DOB: {child.dob} • {child.bloodGroup || 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          startEditingChild(child);
                          setIsAddingChild(false);
                        }}
                        className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-600"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    {/* Integrated Vaccination Tracker */}
                    <VaccinationTracker child={child} />
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* --- PREGNANCY TAB (for pregnant women only) --- */}
        {activeTab === 'pregnancy' && patient.userType === 'pregnant' && (
          <section className="space-y-4">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                  <UserPlus size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-pink-800">Pregnancy Status</h3>
                  <p className="text-sm text-pink-600 capitalize">
                    {patient.pregnancyStage?.replace('_', ' ') || 'Stage not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Dates */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3 text-sm">Key Dates</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Last Checkup</span>
                  <span className="font-bold text-slate-800">
                    {patientLogs[patientLogs.length - 1]
                      ? new Date(patientLogs[patientLogs.length - 1].date).toLocaleDateString()
                      : 'Not recorded'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg">
                  <span className="text-sm text-rose-600">Next ANC Visit</span>
                  <span className="font-bold text-rose-700">
                    {patient.nextCheckup
                      ? new Date(patient.nextCheckup).toLocaleDateString()
                      : 'Not scheduled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Signs to Watch */}
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <h4 className="font-bold text-red-700 mb-3 text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> Danger Signs - Call ASHA immediately
              </h4>
              <ul className="grid grid-cols-2 gap-2 text-xs text-red-600">
                <li className="flex items-start gap-1">• Heavy bleeding</li>
                <li className="flex items-start gap-1">• Severe headache</li>
                <li className="flex items-start gap-1">• Blurred vision</li>
                <li className="flex items-start gap-1">• High fever</li>
                <li className="flex items-start gap-1">• Convulsions</li>
                <li className="flex items-start gap-1">• Swelling of face/hands</li>
                <li className="flex items-start gap-1">• Baby not moving</li>
                <li className="flex items-start gap-1">• Water breaking early</li>
              </ul>
            </div>

            {/* ANC Checklist */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3 text-sm">ANC Checklist</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">Registration completed</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Activity size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600">Blood test - {patient.bloodGroup ? 'Done' : 'Pending'}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <HeartPulse size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600">Weight monitoring</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Activity size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600">TT Vaccination</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Activity size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600">IFA tablets distributed</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/asha/visit?patientId=${realId}`)}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              <Activity className="w-4 h-4 mr-2" />
              Record ANC Visit
            </Button>
          </section>
        )}

        {/* --- SCHEMES TAB --- */}
        {activeTab === 'schemes' && (
          <section>
            <h3 className="font-bold text-slate-800 mb-3">{t('asha.eligible_schemes')}</h3>
            <div className="space-y-3">
              {schemes.map(scheme => {
                const isEnrolled = enrollments.some(e => e.schemeId === scheme.id && e.beneficiaryId === realId);
                return (
                  <div key={scheme.id} className="bg-white p-4 rounded-xl border border-slate-100 flex gap-3">
                    <img src={scheme.heroImage} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm">{scheme.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">{scheme.description}</p>

                      {isEnrolled ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <CheckCircle2 size={12} /> {t('schemes.enrolled')}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnroll(scheme.id)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                        >
                          {t('asha.enroll_patient')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Digital Card Modal */}
      {showCard && (
        <DigitalHealthCard
          profile={patient}
          onClose={() => setShowCard(false)}
        />
      )}
    </div>
  );
}
