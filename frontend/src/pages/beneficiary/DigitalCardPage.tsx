import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Edit2, Save, Plus, Ruler, Weight, User, Droplet, Activity, Phone, MapPin, Building2, Stethoscope, Baby, HeartPulse, Pill, AlertTriangle, Navigation, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { BeneficiaryProfile, Child } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { clsx } from 'clsx';
import VaccinationTracker from '../../components/beneficiary/VaccinationTracker';
import { useToast } from '../../store/useToast';
import DigitalHealthCard from '../../components/beneficiary/DigitalHealthCard';

export default function BeneficiaryProfilePage() {
  const { currentUser, beneficiaries, updateBeneficiaryProfile, users, children, addChild } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const profile = beneficiaries.find(b => b.userId === currentUser?.id);

  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'pregnancy' | 'family'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BeneficiaryProfile>>({});
  const [showQR, setShowQR] = useState(false);
  
  // Child Form State
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChild, setNewChild] = useState<Partial<Child>>({ gender: 'male' });

  if (!profile) return null;

  const linkedAsha = users.find(u => u.id === profile.linkedAshaId);
  const myChildren = children.filter(c => c.beneficiaryId === profile.id);

  const startEditing = () => {
    setFormData({
      weight: profile.weight,
      height: profile.height,
      userType: profile.userType,
      bloodGroup: profile.bloodGroup,
      anemiaStatus: profile.anemiaStatus,
      medicalHistory: profile.medicalHistory,
      currentMedications: profile.currentMedications,
      complications: profile.complications,
      address: profile.address,
      gps_coords: profile.gps_coords
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateBeneficiaryProfile(profile.id, formData);
    setIsEditing(false);
    addToast('Profile updated successfully', 'success');
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
    if (newChild.name && newChild.dob) {
      await addChild({
        beneficiaryId: profile.id,
        name: newChild.name,
        dob: newChild.dob,
        gender: newChild.gender as 'male' | 'female',
        bloodGroup: newChild.bloodGroup,
        vaccinations: []
      });
      setIsAddingChild(false);
      setNewChild({ gender: 'male' });
    }
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
        activeTab === id 
          ? "bg-slate-900 text-white shadow-md" 
          : "bg-white text-slate-500 hover:bg-slate-50"
      )}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <ArrowLeft size={24} className="text-slate-800 dark:text-white" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('profile.title')}</h1>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : startEditing()}
          className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-rose-100 text-rose-600' : 'hover:bg-slate-100 text-slate-600'}`}
        >
          {isEditing ? <Save size={24} /> : <Edit2 size={24} />}
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl shadow-slate-200 dark:shadow-slate-900/50">
            <div className="bg-lunari-gradient p-6 text-white text-center relative">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} 
                alt="Profile" 
                className="w-24 h-24 rounded-full bg-white border-4 border-white mx-auto shadow-lg mb-3"
              />
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-rose-100 text-sm font-medium">ID: {profile.id.toUpperCase().slice(0, 8)}</p>
              
              <div className="mt-4 flex justify-center gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase">
                  {profile.userType || 'User'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  profile.riskLevel === 'high' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                }`}>
                  {profile.riskLevel || 'Low'} Risk
                </span>
              </div>

              {/* QR Code Button */}
              <button 
                onClick={() => setShowQR(true)}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-600 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform hover:bg-slate-50"
              >
                <QrCode size={18} /> {t('profile.share_id')}
              </button>
            </div>
          </div>

          {/* Care Team Section */}
          <GlassCard className="p-5 bg-indigo-50 border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-400 uppercase mb-3 tracking-wider">{t('profile.care_team')}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                  <User size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-indigo-400 font-bold uppercase">{t('profile.asha_worker')}</p>
                  <p className="font-bold text-slate-900">{linkedAsha?.name || 'Priya ASHA'}</p>
                </div>
                <button className="p-2 bg-white rounded-full text-indigo-600 hover:bg-indigo-100 transition-colors">
                  <Phone size={16} />
                </button>
              </div>
              <div className="h-px bg-indigo-200/50" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                  <Building2 size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-indigo-400 font-bold uppercase">{t('profile.hospital')}</p>
                  <p className="font-bold text-slate-900">District Hospital, Sector 4</p>
                </div>
                <button className="p-2 bg-white rounded-full text-indigo-600 hover:bg-indigo-100 transition-colors">
                  <MapPin size={16} />
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <TabButton id="personal" label="Personal" icon={User} />
            <TabButton id="medical" label="Medical" icon={HeartPulse} />
            {(profile.userType === 'pregnant' || profile.userType === 'mother') && (
              <TabButton id="pregnancy" label="Pregnancy" icon={Activity} />
            )}
            {profile.userType === 'mother' && (
              <TabButton id="family" label="Children" icon={Baby} />
            )}
          </div>

          {/* Content Sections */}
          <div className="space-y-4">
            
            {/* PERSONAL TAB */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <GlassCard className="p-4 flex flex-col justify-between h-32">
                  <div className="flex items-center gap-2 text-rose-500">
                    <Weight size={20} />
                    <span className="text-xs font-bold uppercase">{t('profile.weight')}</span>
                  </div>
                  {isEditing ? (
                    <div className="flex items-end gap-1">
                      <input 
                        type="number" 
                        value={formData.weight || ''} 
                        placeholder="0"
                        onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                        className="w-full text-3xl font-bold bg-transparent border-b-2 border-rose-200 focus:border-rose-500 outline-none"
                      />
                      <span className="text-sm text-slate-400 mb-1">kg</span>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">
                      {profile.weight || '-'} <span className="text-sm text-slate-400 font-normal">kg</span>
                    </p>
                  )}
                </GlassCard>

                <GlassCard className="p-4 flex flex-col justify-between h-32">
                  <div className="flex items-center gap-2 text-teal-500">
                    <Ruler size={20} />
                    <span className="text-xs font-bold uppercase">{t('profile.height')}</span>
                  </div>
                  {isEditing ? (
                    <div className="flex items-end gap-1">
                      <input 
                        type="number" 
                        value={formData.height || ''} 
                        placeholder="0"
                        onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                        className="w-full text-3xl font-bold bg-transparent border-b-2 border-teal-200 focus:border-teal-500 outline-none"
                      />
                      <span className="text-sm text-slate-400 mb-1">cm</span>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">
                      {profile.height || '-'} <span className="text-sm text-slate-400 font-normal">cm</span>
                    </p>
                  )}
                </GlassCard>

                <GlassCard className="p-4 flex flex-col justify-between h-32 col-span-2">
                  <div className="flex items-center gap-2 text-indigo-500">
                    <User size={20} />
                    <span className="text-xs font-bold uppercase">{t('profile.user_type')}</span>
                  </div>
                  {isEditing ? (
                    <select 
                      value={formData.userType || 'girl'}
                      onChange={(e) => setFormData({...formData, userType: e.target.value as any})}
                      className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold outline-none"
                    >
                      <option value="girl">Girl</option>
                      <option value="pregnant">Pregnant</option>
                      <option value="mother">Mother</option>
                    </select>
                  ) : (
                    <p className="text-xl font-bold text-slate-800 dark:text-white capitalize">
                      {profile.userType || 'User'}
                    </p>
                  )}
                </GlassCard>

                {/* Address Section */}
                <GlassCard className="p-4 col-span-2">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <MapPin size={20} />
                    <span className="text-xs font-bold uppercase">Address & Location</span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea 
                        className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm"
                        placeholder="Enter address..."
                        value={formData.address || ''}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                      <button 
                        onClick={handleGPS}
                        className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg w-full justify-center"
                      >
                        <Navigation size={14} /> Use Current GPS Location
                      </button>
                      {formData.gps_coords && (
                        <p className="text-[10px] text-green-600 text-center font-bold">
                          GPS Set: {formData.gps_coords.lat.toFixed(4)}, {formData.gps_coords.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-slate-800">{profile.address || 'No address set'}</p>
                      {profile.gps_coords && (
                        <p className="text-xs text-slate-500 mt-1">
                          GPS: {profile.gps_coords.lat.toFixed(4)}, {profile.gps_coords.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  )}
                </GlassCard>
              </div>
            )}

            {/* MEDICAL TAB */}
            {activeTab === 'medical' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 text-orange-500 mb-3">
                    <Activity size={20} />
                    <span className="font-bold uppercase text-sm">Medical History</span>
                  </div>
                  {isEditing ? (
                    <textarea 
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
                      rows={3}
                      placeholder="e.g., Diabetes, Thyroid, Allergies..."
                      value={formData.medicalHistory || ''}
                      onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {profile.medicalHistory || 'No history recorded.'}
                    </p>
                  )}
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 text-blue-500 mb-3">
                    <Pill size={20} />
                    <span className="font-bold uppercase text-sm">Current Medications</span>
                  </div>
                  {isEditing ? (
                    <textarea 
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
                      rows={3}
                      placeholder="e.g., Iron tablets, Calcium..."
                      value={formData.currentMedications || ''}
                      onChange={(e) => setFormData({...formData, currentMedications: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {profile.currentMedications || 'No active medications.'}
                    </p>
                  )}
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 text-red-500 mb-3">
                    <Droplet size={20} />
                    <span className="font-bold uppercase text-sm">Anemia Status</span>
                  </div>
                  {isEditing ? (
                    <select 
                      value={formData.anemiaStatus || 'normal'}
                      onChange={(e) => setFormData({...formData, anemiaStatus: e.target.value as any})}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                    >
                      <option value="normal">Normal</option>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      profile.anemiaStatus === 'severe' ? 'bg-red-100 text-red-700' : 
                      profile.anemiaStatus === 'moderate' ? 'bg-orange-100 text-orange-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {profile.anemiaStatus || 'Normal'}
                    </span>
                  )}
                </GlassCard>
              </div>
            )}

            {/* PREGNANCY TAB */}
            {activeTab === 'pregnancy' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 text-purple-500 mb-3">
                    <Baby size={20} />
                    <span className="font-bold uppercase text-sm">Pregnancy Stage</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 capitalize">
                    {profile.pregnancyStage?.replace('_', ' ') || 'Not Set'}
                  </p>
                </GlassCard>

                <GlassCard className="p-5 border-l-4 border-l-red-500">
                  <div className="flex items-center gap-2 text-red-600 mb-3">
                    <AlertTriangle size={20} />
                    <span className="font-bold uppercase text-sm">Complications</span>
                  </div>
                  {isEditing ? (
                    <textarea 
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
                      rows={3}
                      placeholder="e.g., High BP, Bleeding..."
                      value={formData.complications || ''}
                      onChange={(e) => setFormData({...formData, complications: e.target.value})}
                    />
                  ) : (
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {profile.complications || 'None reported.'}
                    </p>
                  )}
                </GlassCard>
              </div>
            )}

            {/* FAMILY TAB */}
            {activeTab === 'family' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {myChildren.map(child => (
                  <div key={child.id} className="space-y-2">
                    <GlassCard className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          child.gender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'
                        }`}>
                          {child.gender === 'female' ? '👧' : '👦'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{child.name}</h3>
                          <p className="text-xs text-slate-500">{child.dob} • {child.bloodGroup || 'N/A'}</p>
                        </div>
                      </div>
                      <button className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                        <Edit2 size={16} className="text-slate-600" />
                      </button>
                    </GlassCard>
                    
                    {/* Integrated Vaccination Tracker */}
                    <VaccinationTracker child={child} />
                  </div>
                ))}

                {isAddingChild ? (
                  <GlassCard className="p-5 bg-slate-50 border-dashed border-2 border-slate-300">
                    <h3 className="font-bold text-slate-800 mb-4">Add Child</h3>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Child Name" 
                        className="w-full p-3 rounded-xl border border-slate-200"
                        value={newChild.name || ''}
                        onChange={e => setNewChild({...newChild, name: e.target.value})}
                      />
                      <input 
                        type="date" 
                        className="w-full p-3 rounded-xl border border-slate-200"
                        value={newChild.dob || ''}
                        onChange={e => setNewChild({...newChild, dob: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 p-3 rounded-xl border border-slate-200"
                          value={newChild.gender}
                          onChange={e => setNewChild({...newChild, gender: e.target.value as any})}
                        >
                          <option value="male">Boy</option>
                          <option value="female">Girl</option>
                        </select>
                        <select 
                          className="flex-1 p-3 rounded-xl border border-slate-200"
                          value={newChild.bloodGroup || ''}
                          onChange={e => setNewChild({...newChild, bloodGroup: e.target.value})}
                        >
                          <option value="">Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="B+">B+</option>
                          <option value="O+">O+</option>
                        </select>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setIsAddingChild(false)} className="flex-1 py-2 text-slate-500 font-bold">Cancel</button>
                        <button onClick={handleAddChild} className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold">Save</button>
                      </div>
                    </div>
                  </GlassCard>
                ) : (
                  <button 
                    onClick={() => setIsAddingChild(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <Plus size={20} /> Add Child
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <DigitalHealthCard 
          profile={profile} 
          onClose={() => setShowQR(false)} 
        />
      )}
    </div>
  );
}
