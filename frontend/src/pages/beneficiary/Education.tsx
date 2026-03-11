import { useState } from 'react';
import { ArrowLeft, Search, BookOpen, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEducationContent, Article } from '../../data/healthContent';
import InfoSheet from '../../components/beneficiary/InfoSheet';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';
import { GlassCard } from '../../components/ui/GlassCard';

export default function BeneficiaryEducation() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { currentUser, beneficiaries } = useStore();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const profile = beneficiaries.find(b => b.userId === currentUser?.id);
  const userType = profile?.userType || 'girl';

  const articles = getEducationContent(language);

  // Filter articles relevant to the user type
  const curatedArticles = articles.filter(a => 
    a.targetAudience.includes(userType)
  );

  // Available categories based on curated articles
  const availableCategories = Array.from(new Set(curatedArticles.map(a => a.category)));

  const categories = [
    { id: 'all', label: t('common.view_all') },
    { id: 'menstrual', label: 'Menstrual Health' }, // Fallback label, should be in translations
    { id: 'pregnancy', label: t('edu.cat_pregnancy') },
    { id: 'baby', label: t('edu.cat_baby') },
    { id: 'nutrition', label: t('edu.cat_nutrition') },
    { id: 'emergency', label: t('edu.cat_emergency') },
    { id: 'mental', label: t('edu.cat_mental') }
  ].filter(c => c.id === 'all' || availableCategories.includes(c.id as any));

  const filteredArticles = curatedArticles.filter(a => {
    const matchesCategory = activeCategory === 'all' || a.category === activeCategory;
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = curatedArticles.find(a => 
    userType === 'pregnant' ? a.category === 'emergency' : 
    userType === 'mother' ? a.category === 'baby' : 
    a.category === 'menstrual'
  ) || curatedArticles[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <ArrowLeft size={24} className="text-slate-800 dark:text-white" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-600" /> {t('edu.title')}
          </h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder={t('edu.search')}
            className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Featured Article */}
        {activeCategory === 'all' && !search && featuredArticle && (
          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">{t('edu.featured')}</h2>
            <div 
              onClick={() => setSelectedArticle(featuredArticle)}
              className={`p-6 rounded-[2.5rem] ${featuredArticle.color} relative overflow-hidden cursor-pointer group`}
            >
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase mb-3 text-slate-800">
                  {featuredArticle.category}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight max-w-[80%]">
                  {featuredArticle.title}
                </h3>
                <p className="text-slate-700 font-medium text-sm mb-6 max-w-[80%]">
                  {featuredArticle.subtitle}
                </p>
                <button className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                  {t('edu.read_article')} <ArrowRight size={14} />
                </button>
              </div>
              
              {/* Decorative Circle */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              
              {/* Icon */}
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-900">
                <featuredArticle.icon size={32} />
              </div>
            </div>
          </section>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Article List */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">
            {activeCategory === 'all' ? t('edu.recent') : categories.find(c => c.id === activeCategory)?.label}
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {filteredArticles.length > 0 ? (
              filteredArticles.map(article => {
                const Icon = article.icon;
                return (
                  <GlassCard 
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="p-4 flex items-center gap-4 hover:border-indigo-200 group"
                  >
                    <div className={`w-16 h-16 rounded-2xl ${article.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-8 h-8 opacity-70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          {article.category}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {article.readTime}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {article.subtitle}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </GlassCard>
                );
              })
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-400 font-medium">No articles found for your profile.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <InfoSheet 
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          title={selectedArticle.title}
          subtitle={selectedArticle.subtitle}
          image={selectedArticle.image}
          sections={selectedArticle.sections}
          themeColor={selectedArticle.color.split(' ')[0]} // Extract bg-color class
        />
      )}
    </div>
  );
}
