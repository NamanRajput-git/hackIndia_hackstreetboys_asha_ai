import { Scheme } from '../../types';
import { ArrowLeft, CheckCircle2, ChevronRight, CheckSquare, Upload, Calendar, Clock, MapPin, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  scheme: Partial<Scheme>;
}

export default function PhonePreview({ scheme }: Props) {
  const config = scheme.micrositeConfig;
  const themeColor = config?.themeColor || 'bg-rose-500';
  
  // Extract color for text/borders based on bg class
  const getTextColor = (bgClass: string) => {
    if (bgClass.includes('rose')) return 'text-rose-600';
    if (bgClass.includes('teal')) return 'text-teal-600';
    if (bgClass.includes('indigo')) return 'text-indigo-600';
    if (bgClass.includes('orange')) return 'text-orange-600';
    if (bgClass.includes('purple')) return 'text-purple-600';
    if (bgClass.includes('slate')) return 'text-slate-900';
    return 'text-slate-900';
  };

  const textColor = getTextColor(themeColor);

  return (
    <div className="w-[320px] h-[640px] bg-black rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800 relative mx-auto select-none overflow-hidden ring-4 ring-slate-200">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-30"></div>
      
      {/* Screen Content */}
      <div className="w-full h-full bg-slate-50 rounded-[2.5rem] overflow-hidden flex flex-col relative font-sans">
        
        {/* Header */}
        <div className={`${themeColor} p-6 pt-12 text-white relative shrink-0 shadow-md transition-colors duration-300`}>
          <ArrowLeft size={20} className="absolute top-12 left-4" />
          <h3 className="font-bold text-xl mt-4 leading-tight line-clamp-2">{scheme.title || 'Campaign Title'}</h3>
          <div className="flex items-center gap-2 mt-2 opacity-90">
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
              {scheme.provider || 'Provider'}
            </span>
            <span className="text-[10px] font-medium">
              {scheme.category || 'Category'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar pb-24">
          
          {/* Hero Banner */}
          {scheme.heroImage && (
            <div className="w-full h-32 rounded-2xl overflow-hidden shadow-sm">
              <img src={scheme.heroImage} className="w-full h-full object-cover" alt="Banner" />
            </div>
          )}

          {/* Targeting Tags (Preview Only) */}
          <div className="flex flex-wrap gap-1">
            {scheme.targetAudience?.userTypes?.map(t => (
              <span key={t} className="text-[9px] font-bold uppercase px-2 py-1 bg-slate-200 text-slate-600 rounded-md">
                {t}
              </span>
            ))}
            {scheme.targetAudience?.riskLevel?.map(r => (
              <span key={r} className="text-[9px] font-bold uppercase px-2 py-1 bg-red-100 text-red-600 rounded-md">
                {r} Risk
              </span>
            ))}
          </div>
          
          {/* About Section */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            {config?.aboutSection?.image && (
              <img 
                src={config.aboutSection.image} 
                alt="About" 
                className="w-full h-32 object-cover rounded-xl mb-3 shadow-sm"
              />
            )}
            <h4 className={`font-bold text-sm mb-2 ${textColor} uppercase tracking-wide flex items-center gap-2`}>
              <Info size={14} /> {config?.aboutSection?.title || 'About'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {config?.aboutSection?.content || 'Description goes here...'}
            </p>
          </div>

          {/* Tasks List */}
          {config?.tasks && config.tasks.length > 0 && (
            <div>
              <h4 className="font-bold text-xs text-slate-400 uppercase mb-3 tracking-wider ml-1">Your Tasks</h4>
              <div className="space-y-2">
                {config.tasks.map((task, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex items-start gap-3 shadow-sm">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${textColor} border-current opacity-40`}>
                      {/* Checkbox simulation */}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{task.title}</span>
                      {task.description && <span className="text-[10px] text-slate-500 block mt-0.5">{task.description}</span>}
                      {task.isMandatory && (
                        <span className="inline-block mt-1 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Form Fields */}
          {config?.customFormFields && config.customFormFields.length > 0 && (
            <div>
              <h4 className="font-bold text-xs text-slate-400 uppercase mb-3 tracking-wider ml-1">Registration Details</h4>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                {config.customFormFields.map((field, i) => (
                  <div key={i}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'file' ? (
                      <div className="w-full p-3 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 gap-2 text-xs bg-slate-50">
                        <Upload size={14} /> Upload Document
                      </div>
                    ) : field.type === 'date' ? (
                      <div className="w-full p-2.5 border border-slate-200 rounded-xl flex items-center text-slate-400 gap-2 text-xs bg-slate-50">
                        <Calendar size={14} /> Select Date
                      </div>
                    ) : (
                      <div className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 h-9"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Action */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0 absolute bottom-0 left-0 right-0 z-20">
          <button className={`w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg ${themeColor} active:scale-95 transition-transform`}>
            Apply Now
          </button>
        </div>

      </div>
    </div>
  );
}
