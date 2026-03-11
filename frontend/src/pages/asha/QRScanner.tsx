import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine, Search, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useToast } from '../../store/useToast';
import { useStore } from '../../store/useStore';

export default function QRScanner() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { beneficiaries } = useStore();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    // Initialize Scanner Instance
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          onScanSuccess,
          (errorMessage) => {
            // parse error, ignore it.
          }
        );
        setIsScanning(true);
        setScanError(null);
      } catch (err) {
        console.error("Error starting scanner", err);
        setScanError("Camera access failed. Please ensure permissions are granted.");
        setIsScanning(false);
      }
    };

    // Auto-start
    startScanner();

    // Cleanup
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
      } else {
        html5QrCode.clear();
      }
    };
  }, []);

  const onScanSuccess = (decodedText: string) => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(console.error);
    }
    
    try {
      // Try parsing JSON format: { "id": "...", "name": "..." }
      const data = JSON.parse(decodedText);
      if (data.id) {
        handleFoundPatient(data.id);
      } else {
        throw new Error("Invalid QR Data");
      }
    } catch (e) {
      // If not JSON, assume it's a raw ID string
      handleFoundPatient(decodedText);
    }
  };

  const handleFoundPatient = (queryId: string) => {
    // Search logic: Exact ID, Short ID (start), or Name
    const patient = beneficiaries.find(b => 
      b.id === queryId || 
      b.id.toLowerCase().startsWith(queryId.toLowerCase())
    );

    if (patient) {
      addToast(`Patient found: ${patient.name}`, 'success');
      navigate(`/asha/patient/${patient.id}`);
    } else {
      addToast('Patient not found in database', 'error');
      // Restart scanner if needed, or let user try again
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    const query = manualId.trim().toLowerCase();
    
    // Enhanced Search: ID (full/partial) OR Name
    const patient = beneficiaries.find(b => 
      b.id.toLowerCase().startsWith(query) || 
      b.name.toLowerCase().includes(query)
    );

    if (patient) {
      navigate(`/asha/patient/${patient.id}`);
    } else {
      addToast('No patient found with that ID or Name', 'error');
    }
  };

  const retryCamera = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white font-bold text-lg tracking-wider">SCAN PATIENT CARD</h1>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-black rounded-3xl overflow-hidden relative aspect-square flex items-center justify-center border border-white/10">
          <div id="reader" className="w-full h-full"></div>
          
          {!isScanning && !scanError && (
             <div className="absolute inset-0 flex items-center justify-center text-white/50">
               <Camera className="animate-pulse w-12 h-12" />
             </div>
          )}

          {scanError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="font-bold text-lg mb-2">Camera Error</p>
              <p className="text-sm text-slate-400 mb-6">{scanError}</p>
              <button 
                onClick={retryCamera}
                className="px-6 py-2 bg-teal-600 rounded-full font-bold text-sm"
              >
                Retry Camera
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-teal-400">
            <ScanLine className={isScanning ? "animate-pulse" : ""} />
            <span className="font-bold tracking-wider">{isScanning ? "SCANNING..." : "CAMERA OFF"}</span>
          </div>
          <p className="text-white/60 text-sm">Point camera at the beneficiary's QR code</p>
        </div>

        {/* Manual Fallback */}
        <div className="w-full max-w-xs mt-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px bg-white/20 flex-1" />
            <span className="text-white/40 text-xs uppercase font-bold">Or enter ID / Name</span>
            <div className="h-px bg-white/20 flex-1" />
          </div>
          <form onSubmit={handleManualSubmit} className="relative">
            <input 
              type="text" 
              placeholder="e.g. 8a2b... or Sunita"
              className="w-full pl-4 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-teal-500 transition-colors"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Search size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
