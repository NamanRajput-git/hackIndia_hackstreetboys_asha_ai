import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import CampaignBuilder from '../../components/partner/CampaignBuilder';
import { Scheme } from '../../types';

export default function CreateScheme() {
  const navigate = useNavigate();
  const { id } = useParams(); // Check if editing
  const { addScheme, updateScheme, schemes } = useStore();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingScheme, setExistingScheme] = useState<Scheme | undefined>(undefined);

  useEffect(() => {
    if (id) {
      const found = schemes.find(s => s.id === id);
      if (found) setExistingScheme(found);
    }
  }, [id, schemes]);

  const handleSave = async (schemeData: Partial<Scheme>) => {
    setIsSubmitting(true);
    try {
      if (id && existingScheme) {
        await updateScheme(id, schemeData);
        addToast('Campaign updated successfully', 'success');
      } else {
        await addScheme(schemeData as any);
        addToast('Campaign launched successfully', 'success');
      }
      navigate('/partner/schemes');
    } catch (error) {
      console.error(error);
      addToast('Failed to save campaign', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate('/partner/schemes')} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">
          {id ? 'Edit Campaign' : t('partner.create_campaign')}
        </h1>
      </nav>

      <main className="flex-1 p-6 overflow-hidden">
        <CampaignBuilder 
          initialData={existingScheme} 
          onSave={handleSave} 
          isLoading={isSubmitting} 
        />
      </main>
    </div>
  );
}
