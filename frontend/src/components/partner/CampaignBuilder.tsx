import { useState, useEffect } from 'react';
import { 
  ArrowRight, ArrowLeft, Save, Layout, Target, Smartphone, 
  Plus, Trash2, Check, Palette, Image as ImageIcon, Type,
  Calendar, IndianRupee, FileText, CheckCircle2
} from 'lucide-react';
import { Scheme, MicrositeConfig, CampaignTask, FormField } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import PhonePreview from './PhonePreview';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
  initialData?: Scheme;
  onSave: (data: Partial<Scheme>) => void;
  isLoading: boolean;
}

const DEFAULT_MICROSITE: MicrositeConfig = {
  themeColor: 'bg-rose-500',
  aboutSection: {
    title: 'About this Scheme',
    content: 'This scheme provides essential support for maternal health.',
    image: ''
  },
  tasks: [
    { id: 't1', title: 'Register at Anganwadi', isMandatory: true }
  ],
  customFormFields: []
};

const THEME_COLORS = [
  { label: 'Rose', value: 'bg-rose-500' },
  { label: 'Teal', value: 'bg-teal-600' },
  { label: 'Indigo', value: 'bg-indigo-600' },
  { label: 'Orange', value: 'bg-orange-500' },
  { label: 'Purple', value: 'bg-purple-600' },
  { label: 'Slate', value: 'bg-slate-800' },
];

export default function CampaignBuilder({ initialData, onSave, isLoading }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Scheme>>({
    title: '',
    description: '',
    provider: 'Govt',
    category: 'financial',
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    heroImage: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80',
    benefits: [],
    eligibilityCriteria: [],
    targetAudience: {
      riskLevel: [],
      economicStatus: [],
      userTypes: [],
      pregnancyStage: []
    },
    status: 'draft', // Default
    micrositeConfig: DEFAULT_MICROSITE,
    ...initialData
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        targetAudience: { ...prev.targetAudience, ...initialData.targetAudience },
        micrositeConfig: { ...prev.micrositeConfig, ...initialData.micrositeConfig }
      }));
    }
  }, [initialData]);

  const updateField = (field: keyof Scheme, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAudience = (field: keyof typeof formData.targetAudience, value: any) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: { ...prev.targetAudience, [field]: value }
    }));
  };

  const updateMicrosite = (field: keyof MicrositeConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      micrositeConfig: { ...prev.micrositeConfig!, [field]: value }
    }));
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  // --- STEP 1: BASICS ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partner.campaign_title')}</label>
          <input 
            type="text" 
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
            value={formData.title}
            onChange={e => updateField('title', e.target.value)}
            placeholder="e.g. Janani Suraksha Yojana"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Provider Organization</label>
          <select 
            className="w-full p-4 rounded-xl border border-slate-200 bg-white font-medium"
            value={formData.provider}
            onChange={e => updateField('provider', e.target.value)}
          >
            <option value="Govt">Government (State/Central)</option>
            <option value="NGO">NGO / Non-Profit</option>
            <option value="Private">Private Partner</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partner.description')}</label>
        <textarea 
          className="w-full p-4 rounded-xl border border-slate-200 h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={formData.description}
          onChange={e => updateField('description', e.target.value)}
          placeholder="Describe the scheme benefits and goals..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
          <div className="relative">
            <Layout className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            <select 
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-white appearance-none"
              value={formData.category}
              onChange={e => updateField('category', e.target.value)}
            >
              <option value="financial">Financial Aid</option>
              <option value="nutrition">Nutrition Support</option>
              <option value="health">Health Checkup</option>
              <option value="education">Education</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partner.budget')}</label>
          <div className="relative">
            <IndianRupee className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            <input 
              type="number" 
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200"
              value={formData.budget}
              onChange={e => updateField('budget', Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partner.start_date')}</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            <input 
              type="date" 
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200"
              value={formData.startDate}
              onChange={e => updateField('startDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Banner Image URL</label>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <ImageIcon className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200"
              value={formData.heroImage}
              onChange={e => updateField('heroImage', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="w-32 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
            {formData.heroImage ? (
              <img src={formData.heroImage} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Preview</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- STEP 2: TARGETING ---
  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      {/* User Type */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" /> Beneficiary Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'girl', label: 'Adolescent Girl', desc: 'Age 10-19' },
            { id: 'pregnant', label: 'Pregnant Woman', desc: 'ANC Care' },
            { id: 'mother', label: 'Lactating Mother', desc: '0-2 Years Child' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => {
                const current = formData.targetAudience?.userTypes || [];
                const updated = current.includes(type.id as any) 
                  ? current.filter(t => t !== type.id) 
                  : [...current, type.id];
                updateAudience('userTypes', updated);
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                formData.targetAudience?.userTypes?.includes(type.id as any)
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 mb-3 flex items-center justify-center ${
                 formData.targetAudience?.userTypes?.includes(type.id as any) ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
              }`}>
                {formData.targetAudience?.userTypes?.includes(type.id as any) && <Check size={14} className="text-white" />}
              </div>
              <h4 className="font-bold text-slate-900">{type.label}</h4>
              <p className="text-xs text-slate-500 mt-1">{type.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Risk Level */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Health Risk Level</h3>
        <div className="flex gap-3">
          {['low', 'medium', 'high'].map(level => (
            <button
              key={level}
              onClick={() => {
                const current = formData.targetAudience?.riskLevel || [];
                const updated = current.includes(level) 
                  ? current.filter(l => l !== level) 
                  : [...current, level];
                updateAudience('riskLevel', updated);
              }}
              className={`px-6 py-3 rounded-xl font-bold capitalize border-2 transition-all ${
                formData.targetAudience?.riskLevel?.includes(level)
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {level} Risk
            </button>
          ))}
        </div>
      </section>

      {/* Economic Status */}
      <section>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Economic Status</h3>
        <div className="flex gap-3">
          {['bpl', 'apl'].map(status => (
            <button
              key={status}
              onClick={() => {
                const current = formData.targetAudience?.economicStatus || [];
                const updated = current.includes(status) 
                  ? current.filter(s => s !== status) 
                  : [...current, status];
                updateAudience('economicStatus', updated);
              }}
              className={`px-6 py-3 rounded-xl font-bold uppercase border-2 transition-all ${
                formData.targetAudience?.economicStatus?.includes(status)
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  // --- STEP 3: CONTENT ---
  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <GlassCard className="p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Theme Color</h3>
        <div className="flex gap-4">
          {THEME_COLORS.map(color => (
            <button
              key={color.value}
              onClick={() => updateMicrosite('themeColor', color.value)}
              className={`w-12 h-12 rounded-full ${color.value} transition-transform hover:scale-110 ring-2 ring-offset-2 ${
                formData.micrositeConfig?.themeColor === color.value ? 'ring-slate-900' : 'ring-transparent'
              }`}
              title={color.label}
            />
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">About Section</h3>
        <div className="space-y-4">
          <input 
            type="text" 
            className="w-full p-3 rounded-xl border border-slate-200"
            placeholder="Section Title (e.g. About this Scheme)"
            value={formData.micrositeConfig?.aboutSection.title}
            onChange={e => updateMicrosite('aboutSection', { ...formData.micrositeConfig?.aboutSection, title: e.target.value })}
          />
          <textarea 
            className="w-full p-3 rounded-xl border border-slate-200 h-24"
            placeholder="Detailed content for the microsite..."
            value={formData.micrositeConfig?.aboutSection.content}
            onChange={e => updateMicrosite('aboutSection', { ...formData.micrositeConfig?.aboutSection, content: e.target.value })}
          />
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 p-3 rounded-xl border border-slate-200"
              placeholder="Image URL (Optional)"
              value={formData.micrositeConfig?.aboutSection.image || ''}
              onChange={e => updateMicrosite('aboutSection', { ...formData.micrositeConfig?.aboutSection, image: e.target.value })}
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );

  // --- STEP 4: INTERACTION ---
  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      {/* Tasks Editor */}
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase">Beneficiary To-Do List</h3>
          <button 
            onClick={() => {
              const tasks = formData.micrositeConfig?.tasks || [];
              updateMicrosite('tasks', [...tasks, { id: Date.now().toString(), title: '', isMandatory: false }]);
            }}
            className="text-xs font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
        <div className="space-y-3">
          {formData.micrositeConfig?.tasks.map((task, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex-1 space-y-2">
                <input 
                  type="text" 
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm font-bold"
                  placeholder="Task Title"
                  value={task.title}
                  onChange={e => {
                    const newTasks = [...(formData.micrositeConfig?.tasks || [])];
                    newTasks[idx].title = e.target.value;
                    updateMicrosite('tasks', newTasks);
                  }}
                />
                <input 
                  type="text" 
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs"
                  placeholder="Description (Optional)"
                  value={task.description || ''}
                  onChange={e => {
                    const newTasks = [...(formData.micrositeConfig?.tasks || [])];
                    newTasks[idx].description = e.target.value;
                    updateMicrosite('tasks', newTasks);
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    const newTasks = [...(formData.micrositeConfig?.tasks || [])];
                    newTasks[idx].isMandatory = !newTasks[idx].isMandatory;
                    updateMicrosite('tasks', newTasks);
                  }}
                  className={`p-2 rounded-lg transition-colors ${task.isMandatory ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-400'}`}
                  title="Toggle Mandatory"
                >
                  <CheckCircle2 size={16} />
                </button>
                <button 
                  onClick={() => {
                    const newTasks = (formData.micrositeConfig?.tasks || []).filter((_, i) => i !== idx);
                    updateMicrosite('tasks', newTasks);
                  }}
                  className="p-2 rounded-lg bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Form Fields Editor */}
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase">Data Collection Form</h3>
          <button 
            onClick={() => {
              const fields = formData.micrositeConfig?.customFormFields || [];
              updateMicrosite('customFormFields', [...fields, { id: Date.now().toString(), label: '', type: 'text', required: false }]);
            }}
            className="text-xs font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
          >
            <Plus size={14} /> Add Field
          </button>
        </div>
        <div className="space-y-3">
          {formData.micrositeConfig?.customFormFields.map((field, idx) => (
            <div key={idx} className="flex gap-3 items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <input 
                type="text" 
                className="flex-1 p-2 bg-white rounded-lg border border-slate-200 text-sm font-bold"
                placeholder="Field Label"
                value={field.label}
                onChange={e => {
                  const newFields = [...(formData.micrositeConfig?.customFormFields || [])];
                  newFields[idx].label = e.target.value;
                  updateMicrosite('customFormFields', newFields);
                }}
              />
              <select 
                className="p-2 bg-white rounded-lg border border-slate-200 text-xs font-medium"
                value={field.type}
                onChange={e => {
                  const newFields = [...(formData.micrositeConfig?.customFormFields || [])];
                  newFields[idx].type = e.target.value as any;
                  updateMicrosite('customFormFields', newFields);
                }}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="file">File Upload</option>
              </select>
              <button 
                onClick={() => {
                  const newFields = (formData.micrositeConfig?.customFormFields || []).filter((_, i) => i !== idx);
                  updateMicrosite('customFormFields', newFields);
                }}
                className="p-2 rounded-lg bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Left: Wizard */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Steps Indicator */}
        <div className="flex items-center gap-2 mb-6 px-1">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-2 rounded-full transition-all duration-500 ${s <= step ? 'w-12 bg-black' : 'w-4 bg-slate-200'}`} />
          ))}
          <span className="ml-auto text-xs font-bold text-slate-400">Step {step} of 4</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-slate-100 flex justify-between items-center bg-slate-50 sticky bottom-0 z-10">
          {step > 1 ? (
            <button 
              onClick={handleBack}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button 
              onClick={handleNext}
              className="px-8 py-3 rounded-xl font-bold bg-black text-white hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg"
            >
              Next Step <ArrowRight size={18} />
            </button>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={() => onSave({ ...formData, status: 'draft' })}
                disabled={isLoading}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors"
              >
                Save Draft
              </button>
              <button 
                onClick={() => onSave({ ...formData, status: 'active' })} // FORCE ACTIVE
                disabled={isLoading}
                className="px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                {isLoading ? 'Launching...' : 'Launch Campaign'} <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Preview */}
      <div className="hidden lg:block w-[380px] shrink-0 bg-slate-100 rounded-[2.5rem] p-8 border border-slate-200 h-full overflow-hidden">
        <div className="text-center mb-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <Smartphone size={16} /> Live Preview
          </h3>
        </div>
        <div className="scale-[0.85] origin-top">
          <PhonePreview scheme={formData} />
        </div>
      </div>
    </div>
  );
}
