import { AlertTriangle, Apple, Baby, Droplets, Moon, Sun, Heart, Brain, Utensils, Sparkles } from 'lucide-react';
import { Language } from '../types';

// --- Nutrition Advice (Kept for Nutrition Page) ---
export const NUTRITION_ADVICE = [
  {
    id: 'iron',
    title: 'Fight Anemia ( खून की कमी )',
    items: ['Jaggery (Gur)', 'Spinach (Saag)', 'Liver', 'Dates'],
    color: 'bg-red-100 text-red-800',
    icon: Droplets
  },
  {
    id: 'protein',
    title: 'Strength ( ताकत )',
    items: ['Dal (Lentils)', 'Chana (Chickpeas)', 'Eggs', 'Milk'],
    color: 'bg-orange-100 text-orange-800',
    icon: Sun
  },
  {
    id: 'vitamins',
    title: 'Immunity ( बचाव )',
    items: ['Citrus Fruits', 'Papaya (Ripe)', 'Carrots', 'Green Veggies'],
    color: 'bg-green-100 text-green-800',
    icon: Apple
  }
];

// --- Multilingual Education Articles ---

export interface ArticleSection {
  title: string;
  content: string;
  badge?: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: 'pregnancy' | 'baby' | 'nutrition' | 'emergency' | 'mental' | 'menstrual';
  icon: any;
  color: string;
  readTime: string;
  image: string;
  targetAudience: ('girl' | 'pregnant' | 'mother')[]; // New Field for Curation
  sections: ArticleSection[];
}

const CONTENT_DB: Record<Language, Article[]> = {
  en: [
    // --- GIRL CONTENT ---
    {
      id: 'menstrual_hygiene',
      title: 'Menstrual Hygiene Basics',
      subtitle: 'Stay clean and confident',
      category: 'menstrual',
      icon: Sparkles,
      color: 'bg-pink-50 border-pink-200',
      readTime: '3 min',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=pads&backgroundColor=fce7f3',
      targetAudience: ['girl', 'mother'],
      sections: [
        { title: 'Change Regularly', content: 'Change your pad or cloth every 4-6 hours to prevent infection.' },
        { title: 'Washing', content: 'Wash yourself with clean water. Avoid using soap inside.' },
        { title: 'Disposal', content: 'Wrap used pads in paper before throwing them in the dustbin. Do not flush.' }
      ]
    },
    {
      id: 'puberty_changes',
      title: 'Understanding Puberty',
      subtitle: 'Changes in your body are normal',
      category: 'menstrual',
      icon: Heart,
      color: 'bg-purple-50 border-purple-200',
      readTime: '4 min',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=growth&backgroundColor=f3e8ff',
      targetAudience: ['girl'],
      sections: [
        { title: 'Physical Changes', content: 'Breast growth, hair growth, and height increase are signs of growing up.' },
        { title: 'Mood Swings', content: 'Feeling happy then sad suddenly is due to hormones. It is okay.' },
        { title: 'Acne', content: 'Pimples are common. Wash your face twice a day with water.' }
      ]
    },
    
    // --- PREGNANT CONTENT ---
    {
      id: 'danger_signs',
      title: 'Danger Signs in Pregnancy',
      subtitle: 'When to call ASHA Didi immediately',
      category: 'emergency',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      readTime: '2 min',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=danger&backgroundColor=fee2e2',
      targetAudience: ['pregnant'],
      sections: [
        { title: 'Severe Headache', content: 'If you have a headache that does not go away with rest, it could be high blood pressure.', badge: 'Urgent' },
        { title: 'Blurred Vision', content: 'Seeing spots or having blurry vision is a sign of Preeclampsia.' },
        { title: 'Swelling', content: 'Sudden swelling of face and hands is dangerous.' },
        { title: 'Bleeding', content: 'Any vaginal bleeding during pregnancy is an emergency.' }
      ]
    },
    
    // --- MOTHER CONTENT ---
    {
      id: 'breastfeeding',
      title: 'Breastfeeding Basics',
      subtitle: 'The first hour is golden',
      category: 'baby',
      icon: Baby,
      color: 'bg-pink-50 border-pink-200',
      readTime: '3 min',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=baby&backgroundColor=fce7f3',
      targetAudience: ['pregnant', 'mother'],
      sections: [
        { title: 'First Hour', content: 'Start breastfeeding within 1 hour of birth. This milk (Colostrum) is the first vaccine.' },
        { title: 'Exclusive Feeding', content: 'Give ONLY breastmilk for 6 months. No water, no honey.' },
        { title: 'Frequency', content: 'Feed the baby whenever they cry, at least 8-12 times a day.' }
      ]
    },
    
    // --- SHARED CONTENT (Nutrition & Mental) ---
    {
      id: 'anemia_diet',
      title: 'Beating Anemia',
      subtitle: 'Iron-rich foods for energy',
      category: 'nutrition',
      icon: Utensils,
      color: 'bg-green-50 border-green-200',
      readTime: '4 min',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=food&backgroundColor=dcfce7',
      targetAudience: ['girl', 'pregnant', 'mother'],
      sections: [
        { title: 'Iron Sources', content: 'Eat spinach, jaggery, pulses, and liver.' },
        { title: 'Vitamin C', content: 'Squeeze lemon on food to help body absorb iron.' },
        { title: 'Avoid Tea', content: 'Do not drink tea/coffee immediately after meals.' }
      ]
    },
    {
      id: 'mental_health',
      title: 'Mental Well-being',
      subtitle: 'It is okay to feel sad',
      category: 'mental',
      icon: Brain,
      color: 'bg-purple-50 border-purple-200',
      readTime: '3 min',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=mind&backgroundColor=f3e8ff',
      targetAudience: ['pregnant', 'mother'],
      sections: [
        { title: 'Baby Blues', content: 'Feeling sad or crying after birth is common due to hormones.' },
        { title: 'Talk About It', content: 'Share your feelings with your husband or ASHA Didi.' },
        { title: 'Rest', content: 'Sleep when the baby sleeps. Fatigue makes sadness worse.' }
      ]
    }
  ],
  hi: [
    {
      id: 'menstrual_hygiene',
      title: 'मासिक धर्म स्वच्छता',
      subtitle: 'साफ रहें और आत्मविश्वास रखें',
      category: 'menstrual',
      icon: Sparkles,
      color: 'bg-pink-50 border-pink-200',
      readTime: '3 मिनट',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=pads&backgroundColor=fce7f3',
      targetAudience: ['girl', 'mother'],
      sections: [
        { title: 'नियमित रूप से बदलें', content: 'संक्रमण से बचने के लिए हर 4-6 घंटे में अपना पैड या कपड़ा बदलें।' },
        { title: 'सफाई', content: 'अपने आप को साफ पानी से धोएं। अंदर साबुन का प्रयोग न करें।' },
        { title: 'निपटान', content: 'इस्तेमाल किए गए पैड को डस्टबिन में फेंकने से पहले कागज में लपेट लें।' }
      ]
    },
    {
      id: 'danger_signs',
      title: 'गर्भावस्था में खतरे के संकेत',
      subtitle: 'आशा दीदी को कब बुलाएं',
      category: 'emergency',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      readTime: '2 मिनट',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=danger&backgroundColor=fee2e2',
      targetAudience: ['pregnant'],
      sections: [
        { title: 'तेज सिरदर्द', content: 'अगर सिरदर्द आराम करने से भी न जाए, तो यह हाई बीपी हो सकता है।', badge: 'जरूरी' },
        { title: 'धुंधला दिखना', content: 'आंखों के सामने अंधेरा छाना खतरे की घंटी है।' },
        { title: 'सूजन', content: 'चेहरे और हाथों में अचानक सूजन आना खतरनाक है।' },
        { title: 'खून बहना', content: 'गर्भावस्था में कभी भी खून आए तो तुरंत अस्पताल जाएं।' }
      ]
    },
    {
      id: 'breastfeeding',
      title: 'स्तनपान की जानकारी',
      subtitle: 'पहला घंटा अनमोल है',
      category: 'baby',
      icon: Baby,
      color: 'bg-pink-50 border-pink-200',
      readTime: '3 मिनट',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=baby&backgroundColor=fce7f3',
      targetAudience: ['pregnant', 'mother'],
      sections: [
        { title: 'पहला घंटा', content: 'जन्म के 1 घंटे के भीतर स्तनपान शुरू करें। यह दूध (कोलोस्ट्रम) पहला टीका है।' },
        { title: 'केवल माँ का दूध', content: '6 महीने तक केवल स्तनपान कराएं। पानी या शहद न दें।' },
        { title: 'कितनी बार', content: 'बच्चा जब भी रोए, दूध पिलाएं। दिन में 8-12 बार।' }
      ]
    },
    {
      id: 'anemia_diet',
      title: 'एनीमिया को हराएं',
      subtitle: 'ताकत के लिए आयरन युक्त भोजन',
      category: 'nutrition',
      icon: Utensils,
      color: 'bg-green-50 border-green-200',
      readTime: '4 मिनट',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=food&backgroundColor=dcfce7',
      targetAudience: ['girl', 'pregnant', 'mother'],
      sections: [
        { title: 'आयरन के स्रोत', content: 'पालक, गुड़, दालें और कलेजी खाएं।' },
        { title: 'विटामिन सी', content: 'खाने पर नींबू निचोड़ें, इससे शरीर आयरन सोखता है।' },
        { title: 'चाय से बचें', content: 'खाने के तुरंत बाद चाय/कॉफी न पिएं।' }
      ]
    },
    {
      id: 'mental_health',
      title: 'प्रसव बाद उदासी',
      subtitle: 'उदास महसूस करना सामान्य है',
      category: 'mental',
      icon: Brain,
      color: 'bg-purple-50 border-purple-200',
      readTime: '3 मिनट',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=mind&backgroundColor=f3e8ff',
      targetAudience: ['pregnant', 'mother'],
      sections: [
        { title: 'बेबी ब्लूज़', content: 'हार्मोन के कारण जन्म के बाद रोना या उदास होना आम है।' },
        { title: 'बात करें', content: 'अपनी भावनाओं को पति या आशा दीदी के साथ साझा करें।' },
        { title: 'आराम', content: 'जब बच्चा सोए, तब आप भी सोएं। थकान उदासी बढ़ाती है।' }
      ]
    }
  ],
  bho: [
    {
      id: 'danger_signs',
      title: 'गर्भावस्था में खतरा',
      subtitle: 'आशा दीदी के कब बोलावे के बा',
      category: 'emergency',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      readTime: '2 मिनट',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=danger&backgroundColor=fee2e2',
      targetAudience: ['pregnant'],
      sections: [
        { title: 'कपार दरद', content: 'अगर कपार दरद ठीक ना होखे, त बीपी बढ़ल हो सकेला।', badge: 'जरूरी' },
        { title: 'धुंधला लउकल', content: 'आँख के सोझा अँधियारी आवे त तुरंत अस्पताल जाईं।' },
        { title: 'सूजन', content: 'मुँह आ हाथ में सूजन आवे त ई खतरा बा।' },
        { title: 'खून आवे के', content: 'पेट में लइका रहला प खून आवे त तुरंत डॉक्टर के दिखाईं।' }
      ]
    },
    {
      id: 'breastfeeding',
      title: 'दूध पियावे के तरीका',
      subtitle: 'पहिलका दूध अमृत होखेला',
      category: 'baby',
      icon: Baby,
      color: 'bg-pink-50 border-pink-200',
      readTime: '3 मिनट',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=baby&backgroundColor=fce7f3',
      targetAudience: ['pregnant', 'mother'],
      sections: [
        { title: 'पहिलका घंटा', content: 'लइका होखे के 1 घंटा के भीतर दूध पियावल शुरू करीं।' },
        { title: 'खाली माई के दूध', content: '6 महीना तक खाली अपना दूध पियाईं। पानी चाहे मधु मत दीं।' },
        { title: 'कब पियावे के', content: 'जब लइका रोवे, तब दूध पियाईं।' }
      ]
    },
    {
      id: 'anemia_diet',
      title: 'खून के कमी',
      subtitle: 'ताकत वाला खाना',
      category: 'nutrition',
      icon: Utensils,
      color: 'bg-green-50 border-green-200',
      readTime: '4 मिनट',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=food&backgroundColor=dcfce7',
      targetAudience: ['girl', 'pregnant', 'mother'],
      sections: [
        { title: 'का खाए के बा', content: 'पालक, गुड़, चना आ दाल खाईं।' },
        { title: 'नेंबू', content: 'दाल-भात में नेंबू गार के खाईं, खून बढ़ी।' },
        { title: 'चाय मत पीहीं', content: 'खाना खइला के बाद चाय मत पीहीं।' }
      ]
    }
  ],
  pa: [
    {
      id: 'danger_signs',
      title: 'ਗਰਭ ਅਵਸਥਾ ਵਿੱਚ ਖਤਰੇ',
      subtitle: 'ਆਸ਼ਾ ਦੀਦੀ ਨੂੰ ਕਦੋਂ ਬੁਲਾਉਣਾ ਹੈ',
      category: 'emergency',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      readTime: '2 ਮਿੰਟ',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=danger&backgroundColor=fee2e2',
      targetAudience: ['pregnant'],
      sections: [
        { title: 'ਸਿਰ ਦਰਦ', content: 'ਜੇਕਰ ਸਿਰ ਦਰਦ ਆਰਾਮ ਨਾਲ ਠੀਕ ਨਹੀਂ ਹੁੰਦਾ, ਤਾਂ ਇਹ ਹਾਈ ਬੀਪੀ ਹੋ ਸਕਦਾ ਹੈ।', badge: 'ਜਰੂਰੀ' },
        { title: 'ਧੁੰਦਲਾ ਦਿਖਣਾ', content: 'ਅੱਖਾਂ ਅੱਗੇ ਹਨੇਰਾ ਆਉਣਾ ਖਤਰੇ ਦੀ ਨਿਸ਼ਾਨੀ ਹੈ।' },
        { title: 'ਸੋਜ', content: 'ਚਿਹਰੇ ਅਤੇ ਹੱਥਾਂ ਤੇ ਅਚਾਨਕ ਸੋਜ ਆਉਣਾ ਖਤਰਨਾਕ ਹੈ।' }
      ]
    }
  ],
  mr: [
    {
      id: 'danger_signs',
      title: 'गरोदरपणात धोक्याची चिन्हे',
      subtitle: 'आशा ताईंना कधी बोलवायचे',
      category: 'emergency',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      readTime: '2 मिनिटे',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=danger&backgroundColor=fee2e2',
      targetAudience: ['pregnant'],
      sections: [
        { title: 'तीव्र डोकेदुखी', content: 'जर डोकेदुखी विश्रांतीने थांबत नसेल, तर तो उच्च रक्तदाब असू शकतो.', badge: 'तातडीचे' },
        { title: 'अंधुक दिसणे', content: 'डोळ्यांसमोर अंधारी येणे हे धोक्याचे लक्षण आहे.' },
        { title: 'सूज', content: 'चेहरा आणि हातांवर अचानक सूज येणे धोकादायक आहे.' }
      ]
    }
  ]
};

// Fallback logic
export const getEducationContent = (lang: Language): Article[] => {
  return CONTENT_DB[lang] || CONTENT_DB['en'];
};
