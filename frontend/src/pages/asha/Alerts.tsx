import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle2, Phone, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { parseISO, format } from 'date-fns';

export default function AshaAlerts() {
  const { alerts, beneficiaries, resolveAlert } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const activeAlerts = alerts.filter(a => a.status === 'open');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  const formatDate = (timestamp: string) => {
    try {
      if (!timestamp) return 'Just now';
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'dd MMM, hh:mm a');
    } catch (e) {
      return 'Unknown date';
    }
  };

  const handleCall = () => {
    // In a real app, this would use the patient's phone number
    // For MVP/SOS, we dial the emergency ambulance service (108 in India)
    window.location.href = 'tel:108';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white sticky top-0 z-10 border-b shadow-sm p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="font-bold text-lg text-slate-800">{t('nav.alerts')}</h1>
      </div>

      <div className="p-4 space-y-6">
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">{t('asha.alerts_active')}</h2>
          {activeAlerts.length === 0 ? (
             <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
               <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
               <p className="text-slate-500 font-medium">No active alerts.</p>
             </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map(alert => {
                const patient = beneficiaries.find(b => b.id === alert.beneficiaryId);
                return (
                  <div key={alert.id} className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 bg-red-50/50 flex items-start gap-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-bold text-red-900 text-lg">SOS TRIGGERED</h3>
                        <p className="text-red-700 text-sm font-medium">{formatDate(alert.timestamp)}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 uppercase font-bold">Patient</p>
                        <p className="text-lg font-bold text-slate-900">{patient?.name || 'Unknown'}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                           <MapPin size={14} /> {patient?.address || 'Location not available'}
                        </p>
                        {patient?.gps_coords && (
                          <a 
                            href={`https://www.google.com/maps?q=${patient.gps_coords.lat},${patient.gps_coords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-2 bg-indigo-50 px-2 py-1 rounded w-fit"
                          >
                            View on Google Maps
                          </a>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleCall}
                          className="flex-1 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                        >
                          <Phone className="w-4 h-4 mr-2" /> {t('profile.call')} (108)
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {resolvedAlerts.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">Resolved History</h2>
            <div className="space-y-3 opacity-60">
              {resolvedAlerts.map(alert => {
                const patient = beneficiaries.find(b => b.id === alert.beneficiaryId);
                return (
                  <div key={alert.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{formatDate(alert.timestamp)}</p>
                    </div>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded flex items-center gap-1">
                      <CheckCircle2 size={12} /> RESOLVED
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
