import { useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, ArrowUpRight, Mic, Shield, Stethoscope, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    navigate('/role-select');
  };

  const faqs = [
    {
      question: "How do you handle different dialects?",
      answer: "ASHA AI uses advanced multilingual models trained specifically on rural Indian dialects (Bhojpuri, Maithili, etc.) to ensure accurate voice recognition regardless of accent."
    },
    {
      question: "Is this replacing doctors?",
      answer: "No. ASHA AI is a triage and support tool. It empowers ASHA workers to identify risks early and refer patients to doctors when medical intervention is needed."
    },
    {
      question: "What is the funding used for?",
      answer: "Funding goes directly towards server costs for AI processing, expanding our dialect database, and providing low-cost hardware to ASHA workers in remote villages."
    }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-black selection:text-white">
      
      {/* Navbar */}
      <nav className="max-w-[1400px] mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter">ASHA AI</span>
          <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-full text-slate-500">BETA</span>
        </div>

        <div className="flex items-center gap-4">
          <LanguageToggle />
          <button 
            onClick={() => navigate('/login')}
            className="hidden md:block px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
          >
            {t('landing.login')}
          </button>
          <button 
            onClick={handleGetStarted}
            className="px-4 py-2 text-xs md:px-8 md:py-3 md:text-sm font-bold bg-black text-white rounded-full hover:bg-slate-800 transition-transform active:scale-95"
          >
            {t('landing.get_started')}
          </button>
          <button className="md:hidden p-2">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 pt-12 pb-20 space-y-32">
        
        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-5xl lg:text-7xl font-mplus tracking-tight leading-[1.1] mb-8 text-slate-900"
          >
            {t('landing.hero_title')} <br className="hidden md:block" />
            <span className="text-rose-500">{t('landing.hero_subtitle')}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            {t('landing.hero_desc')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
             <button 
               className="h-11 px-6 rounded-full bg-[#D63384] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#be2d75] transition-all shadow-lg shadow-pink-200 hover:gap-3"
             >
               {t('landing.partner_btn')} <ArrowRight size={16} />
             </button>

             <button 
               onClick={handleGetStarted}
               className="h-11 px-6 rounded-full border border-slate-200 bg-white text-slate-900 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
             >
               <Mic size={16} className="text-slate-600" /> {t('landing.ai_btn')}
             </button>
          </motion.div>
        </div>

        {/* Featured Modules Grid */}
        <div>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold tracking-tight">{t('landing.modules')}</h2>
            <button className="text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all">
              {t('common.view_all')} <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Strategy */}
            <motion.div whileHover={{ y: -5 }} className="bg-[#4ADE80] p-8 rounded-[2.5rem] h-[420px] flex flex-col justify-between relative group cursor-pointer shadow-sm">
              <div>
                <p className="text-xs font-bold tracking-widest opacity-60 mb-4 uppercase">{t('landing.strategy')}</p>
                <h3 className="text-3xl font-bold leading-tight mb-4">Community Health Momentum</h3>
                <p className="font-medium opacity-80 leading-relaxed">Voice-first maternal care designed for low-literacy, low-connectivity environments.</p>
              </div>
              <div className="flex justify-between items-end border-t border-black/10 pt-6">
                <div><p className="text-xs font-bold opacity-60 uppercase">Reach</p><p className="text-2xl font-bold">100% Offline</p></div>
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center group-hover:rotate-45 transition-transform"><ArrowUpRight size={20} /></div>
              </div>
            </motion.div>

            {/* Card 2: Platform */}
            <motion.div whileHover={{ y: -5 }} className="bg-sky-200 text-slate-900 p-8 rounded-[2.5rem] h-[420px] flex flex-col justify-between relative group cursor-pointer shadow-sm">
              <div>
                <p className="text-xs font-bold tracking-widest opacity-60 mb-4 uppercase">{t('landing.platform')}</p>
                <h3 className="text-3xl font-bold leading-tight mb-4">Long-Term Care Continuum</h3>
                <p className="font-medium opacity-70 leading-relaxed text-slate-700">End-to-end pregnancy to post-natal health tracking with portable digital records.</p>
              </div>
              <div className="flex justify-between items-end border-t border-black/10 pt-6">
                <div><p className="text-xs font-bold opacity-60 uppercase">Impact</p><p className="text-2xl font-bold">9 Months+</p></div>
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center group-hover:rotate-45 transition-transform"><ArrowUpRight size={20} /></div>
              </div>
            </motion.div>

            {/* Card 3: Intelligence */}
            <motion.div whileHover={{ y: -5 }} className="bg-[#C084FC] p-8 rounded-[2.5rem] h-[420px] flex flex-col justify-between relative group cursor-pointer shadow-sm">
              <div>
                <p className="text-xs font-bold tracking-widest opacity-60 mb-4 uppercase">{t('landing.intelligence')}</p>
                <h3 className="text-3xl font-bold leading-tight mb-4">Focused Risk Intelligence</h3>
                <p className="font-medium opacity-80 leading-relaxed">AI-powered voice analysis to flag high-risk pregnancies early.</p>
              </div>
              <div className="flex justify-between items-end border-t border-black/10 pt-6">
                <div><p className="text-xs font-bold opacity-60 uppercase">Accuracy</p><p className="text-2xl font-bold">Real-time</p></div>
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center group-hover:rotate-45 transition-transform"><ArrowUpRight size={20} /></div>
              </div>
            </motion.div>

            {/* Card 4: Emergency */}
            <motion.div whileHover={{ y: -5 }} className="bg-[#FACC15] p-8 rounded-[2.5rem] h-[420px] flex flex-col justify-between relative group cursor-pointer shadow-sm">
              <div>
                <p className="text-xs font-bold tracking-widest opacity-60 mb-4 uppercase">{t('landing.emergency')}</p>
                <h3 className="text-3xl font-bold leading-tight mb-4">Red Zone Network</h3>
                <p className="font-medium opacity-80 leading-relaxed">One-tap SOS alerts ASHA workers, NGOs, and emergency services instantly.</p>
              </div>
              <div className="flex justify-between items-end border-t border-black/10 pt-6">
                <div><p className="text-xs font-bold opacity-60 uppercase">Response</p><p className="text-2xl font-bold">Instant</p></div>
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center group-hover:rotate-45 transition-transform"><ArrowUpRight size={20} /></div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Humanize Section */}
        <div className="text-center">
          <p className="text-rose-500 font-bold tracking-widest uppercase text-sm mb-4">ENTER ASHA AI</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-16 max-w-4xl mx-auto leading-tight">
            {t('landing.humanize')}
          </h2>
          {/* ... (Icons section remains similar, just text) ... */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-left h-full flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500 mb-6"><Mic size={28} /></div>
              <h3 className="text-2xl font-bold mb-4">Voice-First Technology</h3>
              <p className="text-slate-500 font-medium leading-relaxed">If Radha can speak, she can use ASHA AI. No typing, no reading—just conversation in her local dialect.</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-left h-full flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-500 mb-6"><Shield size={28} /></div>
              <h3 className="text-2xl font-bold mb-4">Privacy at the Core</h3>
              <p className="text-slate-500 font-medium leading-relaxed">With 'Whisper Mode', Radha can ask sensitive questions without fear, knowing her data stays on her device.</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-left h-full flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 mb-6"><Stethoscope size={28} /></div>
              <h3 className="text-2xl font-bold mb-4">Supercharging ASHA Workers</h3>
              <p className="text-slate-500 font-medium leading-relaxed">We don't replace ASHA workers; we give them a digital assistant to prioritize high-risk patients like Radha.</p>
            </div>
          </div>
        </div>

        {/* Voices Section */}
        <div>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Voices from the Field</h2>
            <p className="text-slate-500 font-medium text-lg">Real stories from women who use ASHA AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[4rem]"></div>
              <div className="relative z-10">
                <div className="text-rose-400 mb-6"><MessageCircle size={40} className="fill-current" /></div>
                <p className="text-xl font-medium text-slate-700 italic mb-8 leading-relaxed">"ASHA told me my dizziness was due to Anemia. I started eating spinach and jaggery as suggested."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">S</div>
                  <div><h4 className="font-bold text-slate-900">Sunita Devi</h4><p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Bihar</p></div>
                </div>
              </div>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[4rem]"></div>
              <div className="relative z-10">
                <div className="text-purple-400 mb-6"><MessageCircle size={40} className="fill-current" /></div>
                <p className="text-xl font-medium text-slate-700 italic mb-8 leading-relaxed">"I was scared about my pregnancy dates. ASHA helped me track everything without a calendar."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">P</div>
                  <div><h4 className="font-bold text-slate-900">Priya Singh</h4><p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Uttar Pradesh</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center text-slate-900 mb-12">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <button onClick={() => toggleFaq(index)} className="w-full flex items-center justify-between p-6 text-left">
                  <span className="font-bold text-lg text-slate-900">{faq.question}</span>
                  <div className={`p-2 rounded-full transition-colors ${openFaq === index ? 'bg-slate-100' : 'bg-white'}`}>
                    {openFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-6 pb-6 text-slate-500 font-medium leading-relaxed">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-12 mt-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6 text-sm font-bold text-slate-600">
              <a href="#" className="hover:text-black">Terms Policy</a>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <a href="#" className="hover:text-black">Customer Story</a>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <a href="#" className="hover:text-black">Government Partners</a>
            </div>
            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer">
              <ArrowRight size={20} />
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
