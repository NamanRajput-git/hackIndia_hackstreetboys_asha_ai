import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../data/translations';

export function useTranslation() {
  const { language } = useStore();
  
  const t = (key: string) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
  };

  return { t, language };
}
