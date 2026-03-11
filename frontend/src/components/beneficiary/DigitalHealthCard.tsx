import QRCode from 'react-qr-code';
import { BeneficiaryProfile } from '../../types';
import { X, Share2, Download, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  profile: BeneficiaryProfile;
  onClose: () => void;
}

export default function DigitalHealthCard({ profile, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="bg-rose-600 p-6 text-white text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30">
            <X size={20} />
          </button>
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} 
            alt="Profile" 
            className="w-20 h-20 rounded-full bg-white border-4 border-white mx-auto shadow-lg mb-3"
          />
          <h2 className="text-xl font-bold">{profile.name}</h2>
          <p className="text-rose-100 text-sm">ID: {profile.id.toUpperCase().slice(0, 8)}</p>
        </div>

        {/* QR Section */}
        <div className="p-6 flex flex-col items-center justify-center bg-white">
          <div className="p-4 bg-white rounded-xl shadow-lg border-2 border-slate-100">
            <QRCode 
              value={JSON.stringify({ id: profile.id, name: profile.name })} 
              size={160}
              level="H"
              fgColor="#e11d48"
            />
          </div>
          
          {/* Address Display */}
          <div className="mt-6 w-full bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-rose-500 shadow-sm shrink-0">
              <MapPin size={16} />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {profile.address || 'No address registered'}
              </p>
              {profile.gps_coords && (
                <p className="text-[10px] text-slate-500">
                  GPS: {profile.gps_coords.lat.toFixed(4)}, {profile.gps_coords.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-slate-50 p-6 grid grid-cols-2 gap-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500 uppercase">Risk Level</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${
              profile.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 
              profile.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700' : 
              'bg-green-100 text-green-700'
            }`}>
              {profile.riskLevel?.toUpperCase() || 'LOW'}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">Status</p>
            <p className="font-bold text-slate-800 capitalize">
              {profile.pregnancyStage?.replace('_', ' ') || profile.userType}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">Blood Group</p>
            <p className="font-bold text-slate-800">{profile.bloodGroup || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">Anemia</p>
            <p className="font-bold text-slate-800 capitalize">{profile.anemiaStatus || 'Normal'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-xl font-medium text-slate-700 hover:bg-slate-200">
            <Share2 size={18} /> Share
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 rounded-xl font-medium text-white hover:bg-rose-700">
            <Download size={18} /> Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
