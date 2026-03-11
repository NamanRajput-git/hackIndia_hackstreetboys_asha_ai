/**
 * ASHA Voice Recorder Component
 * 
 * Specialized voice interface for ASHA workers to:
 * 1. Record visit notes using voice
 * 2. Automatically extract structured data
 * 3. Allow manual verification and correction before saving
 * 
 * IMPORTANT: This is a healthcare application. All extracted data MUST be
 * verified by the ASHA worker before saving to the database.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    Mic, Square, Save, X,
    CheckCircle2, AlertTriangle, RefreshCw, Loader2,
    User, Activity, Thermometer, Weight, Stethoscope
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Button } from './ui/Button';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { processAshaVoice } from '../services/voiceAgent';
import { useToast } from '../store/useToast';
import { assessRisk, RiskAssessment } from '../utils/riskAssessment';

interface ExtractedVitals {
    blood_pressure?: { systolic: number; diastolic: number } | null;
    weight_kg?: number | null;
    temperature_celsius?: number | null;
}

interface ExtractedVisitData {
    patient_name?: string | null;
    visit_type?: 'routine_checkup' | 'emergency' | 'follow_up' | 'vaccination' | null;
    vitals?: ExtractedVitals;
    symptoms?: string[];
    symptom_severity?: 'mild' | 'moderate' | 'severe' | null;
    services_provided?: string[];
    medicines_distributed?: string[];
    counseling_topics?: string[];
    observations?: string | null;
    concerns_noted?: string | null;
    follow_up_required?: boolean;
    next_visit_date?: string | null;
    referral_needed?: boolean;
    referral_reason?: string | null;
}

interface AshaVoiceRecorderProps {
    patientName?: string;
    patientId?: string;
    onDataExtracted?: (data: ExtractedVisitData) => void;
    onSave?: (data: ExtractedVisitData, transcription: string) => Promise<void>;
    onCancel?: () => void;
}

type RecorderState = 'idle' | 'recording' | 'processing' | 'reviewing' | 'saving';

export default function AshaVoiceRecorder({
    patientName,
    onDataExtracted,
    onSave,
    onCancel
}: AshaVoiceRecorderProps) {
    const { addToast } = useToast();
    const { speak, stop: stopSpeaking } = useTextToSpeech('hi-IN');

    // State
    const [state, setState] = useState<RecorderState>('idle');
    const [transcription, setTranscription] = useState('');
    const [extractedData, setExtractedData] = useState<ExtractedVisitData>({});
    const [editedData, setEditedData] = useState<ExtractedVisitData>({});
    const [confidenceScore, setConfidenceScore] = useState(0);
    const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
    const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentRisk, setCurrentRisk] = useState<RiskAssessment | null>(null);

    // Voice recorder hook
    const {
        state: recorderState,
        startRecording,
        stopRecording,
        resetRecording,
        isSupported
    } = useVoiceRecorder();

    // Initialize edited data when extracted data changes
    useEffect(() => {
        const newData = { ...extractedData };

        // Default BP 120/80 (User Request)
        // Ensure structure exists
        if (!newData.vitals) {
            newData.vitals = {};
        }
        if (!newData.vitals.blood_pressure) {
            newData.vitals.blood_pressure = { systolic: 124, diastolic: 85 };
        } else {
            // Fill partial missing values
            const bp = newData.vitals.blood_pressure;
            if (!bp.systolic) bp.systolic = 124;
            if (!bp.diastolic) bp.diastolic = 85;
        }

        setEditedData(newData);
    }, [extractedData]);

    // Recalculate risk whenever critical data changes (in editedData)
    useEffect(() => {
        if (!editedData.vitals && !editedData.symptoms) {
            setCurrentRisk(null);
            return;
        }

        const sys = editedData.vitals?.blood_pressure?.systolic || 0;
        const dia = editedData.vitals?.blood_pressure?.diastolic || 0;
        const symptoms = editedData.symptoms || [];

        const risk = assessRisk(sys, dia, symptoms, 'trimester_3'); // Defaulting stage for now
        setCurrentRisk(risk);
    }, [editedData.vitals, editedData.symptoms]);

    // Handle start recording
    const handleStartRecording = useCallback(async () => {
        setError(null);
        stopSpeaking();

        try {
            await startRecording();
            setState('recording');

            // Provide audio feedback
            speak('रिकॉर्डिंग शुरू। कृपया विज़िट के बारे में बताएं।');
        } catch (err) {
            console.error('[AshaVoiceRecorder] Failed to start recording:', err);
            setError('माइक्रोफ़ोन एक्सेस नहीं मिल पाया। कृपया अनुमति दें।');
        }
    }, [startRecording, stopSpeaking, speak]);

    // Handle stop recording and process
    const handleStopRecording = useCallback(async () => {
        if (!recorderState.isRecording) return;

        const audioBlob = await stopRecording();
        if (!audioBlob) {
            setState('idle');
            return;
        }

        setState('processing');
        speak('प्रोसेसिंग हो रही है। कृपया प्रतीक्षा करें।');

        try {
            // Process voice recording
            const result = await processAshaVoice(audioBlob, 'hi');

            if (result.success) {
                setTranscription(result.transcription);
                setExtractedData(result.extractedData as ExtractedVisitData);
                setConfidenceScore(result.confidenceScore);
                setMissingFieldsList(result.missingFields);
                setFollowUpQuestion(result.followUpQuestion);

                // Notify parent
                onDataExtracted?.(result.extractedData as ExtractedVisitData);

                // Move to review state
                setState('reviewing');

                // Announce completion
                if (result.confidenceScore >= 0.7) {
                    speak('डेटा निकाला गया। कृपया जांचें और पुष्टि करें।');
                } else {
                    speak('कुछ जानकारी मिसिंग है। कृपया जांचें और जोड़ें।');
                }
            } else {
                throw new Error('Failed to process voice');
            }
        } catch (err) {
            console.error('[AshaVoiceRecorder] Processing error:', err);
            setError('आवाज़ प्रोसेस करने में समस्या हुई। कृपया दोबारा कोशिश करें।');
            setState('idle');
            speak('माफ़ करें, कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।');
        }
    }, [recorderState.isRecording, stopRecording, speak, onDataExtracted]);

    // Handle re-record
    const handleReRecord = useCallback(() => {
        resetRecording();
        setTranscription('');
        setExtractedData({});
        setEditedData({});
        setConfidenceScore(0);
        setMissingFieldsList([]);
        setFollowUpQuestion(null);
        setError(null);
        setState('idle');
    }, [resetRecording]);

    // Handle save with verification
    const handleSave = useCallback(async () => {
        // Validate required fields
        if (!editedData.patient_name && !patientName) {
            addToast('मरीज़ का नाम ज़रूरी है', 'error');
            return;
        }

        setState('saving');

        try {
            // Merge patient info if provided
            const finalData = {
                ...editedData,
                patient_name: editedData.patient_name || patientName,
            };

            await onSave?.(finalData, transcription);

            addToast('विज़िट रिकॉर्ड सेव हो गया', 'success');
            speak('रिकॉर्ड सेव हो गया।');

            // Reset after successful save
            handleReRecord();
        } catch (err) {
            console.error('[AshaVoiceRecorder] Save error:', err);
            addToast('सेव करने में समस्या हुई', 'error');
            setState('reviewing');
        }
    }, [editedData, patientName, transcription, onSave, addToast, speak, handleReRecord]);

    // Update field helper
    const updateField = (field: keyof ExtractedVisitData, value: any) => {
        setEditedData(prev => ({ ...prev, [field]: value }));
    };

    // Update vitals helper
    const updateVitals = (field: keyof ExtractedVitals, value: any) => {
        setEditedData(prev => ({
            ...prev,
            vitals: { ...prev.vitals, [field]: value }
        }));
    };

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Check if microphone is supported
    if (!isSupported) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
                <p className="text-red-700 font-medium">
                    आपका ब्राउज़र वॉइस रिकॉर्डिंग सपोर्ट नहीं करता
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Mic size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold">Voice Visit Recorder</h3>
                            <p className="text-sm text-teal-100">
                                {patientName ? `मरीज़: ${patientName}` : 'विज़िट नोट्स रिकॉर्ड करें'}
                            </p>
                        </div>
                    </div>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertTriangle className="text-red-500 shrink-0" size={18} />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Idle State - Show record button */}
                {state === 'idle' && (
                    <div className="text-center py-8">
                        <p className="text-slate-600 mb-4">
                            विज़िट के बारे में बताएं - मरीज़ का नाम, BP, वज़न, लक्षण, दी गई सेवाएं
                        </p>
                        <motion.button
                            onClick={handleStartRecording}
                            className="w-20 h-20 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg hover:bg-teal-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Mic size={32} />
                        </motion.button>
                        <p className="text-sm text-slate-500 mt-3">
                            रिकॉर्ड करने के लिए दबाएं
                        </p>
                    </div>
                )}

                {/* Recording State */}
                {state === 'recording' && (
                    <div className="text-center py-8">
                        <motion.div
                            className="w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg relative"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50" />
                            <Mic size={36} className="relative z-10" />
                        </motion.div>

                        <p className="text-2xl font-bold text-red-600 mt-4">
                            {formatDuration(recorderState.duration)}
                        </p>
                        <p className="text-slate-600 mt-2">रिकॉर्डिंग हो रही है...</p>

                        <Button
                            onClick={handleStopRecording}
                            variant="outline"
                            className="mt-4 border-red-500 text-red-500 hover:bg-red-50"
                        >
                            <Square size={16} className="mr-2" />
                            रोकें और प्रोसेस करें
                        </Button>
                    </div>
                )}

                {/* Processing State */}
                {state === 'processing' && (
                    <div className="text-center py-12">
                        <Loader2 size={48} className="animate-spin text-teal-600 mx-auto" />
                        <p className="text-slate-600 mt-4">आवाज़ प्रोसेस हो रही है...</p>
                        <p className="text-sm text-slate-500 mt-1">
                            डेटा निकाला जा रहा है
                        </p>
                    </div>
                )}

                {/* Reviewing State - Show extracted data for verification */}
                {state === 'reviewing' && (
                    <div className="space-y-4">
                        {/* Confidence Indicator */}
                        <div className={clsx(
                            "p-3 rounded-lg flex items-center gap-2",
                            confidenceScore >= 0.7 ? "bg-green-50 border border-green-200" :
                                confidenceScore >= 0.4 ? "bg-yellow-50 border border-yellow-200" :
                                    "bg-red-50 border border-red-200"
                        )}>
                            {confidenceScore >= 0.7 ? (
                                <CheckCircle2 className="text-green-600" size={20} />
                            ) : (
                                <AlertTriangle className={clsx(
                                    confidenceScore >= 0.4 ? "text-yellow-600" : "text-red-500"
                                )} size={20} />
                            )}
                            <div className="flex-1">
                                <p className={clsx(
                                    "text-sm font-medium",
                                    confidenceScore >= 0.7 ? "text-green-700" :
                                        confidenceScore >= 0.4 ? "text-yellow-700" :
                                            "text-red-700"
                                )}>
                                    {confidenceScore >= 0.7 ? 'डेटा सही लग रहा है' :
                                        confidenceScore >= 0.4 ? 'कुछ जानकारी मिसिंग है' :
                                            'बहुत कम जानकारी मिली'}
                                </p>
                                {followUpQuestion && (
                                    <p className="text-xs mt-1 text-slate-600">{followUpQuestion}</p>
                                )}
                                {missingFieldsList.length > 0 && (
                                    <p className="text-xs mt-1 text-slate-500">
                                        मिसिंग: {missingFieldsList.join(', ')}
                                    </p>
                                )}
                            </div>
                            <span className="text-xs font-bold">
                                {Math.round(confidenceScore * 100)}%
                            </span>
                        </div>

                        {/* Risk Assessment Alert */}
                        {currentRisk && currentRisk.riskLevel !== 'low' && (
                            <div className={clsx(
                                "p-4 rounded-xl border-l-4 shadow-sm",
                                currentRisk.riskLevel === 'high' ? "bg-red-50 border-red-500" : "bg-orange-50 border-orange-500"
                            )}>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className={clsx(
                                        "w-6 h-6 shrink-0",
                                        currentRisk.riskLevel === 'high' ? "text-red-600" : "text-orange-600"
                                    )} />
                                    <div>
                                        <h3 className={clsx(
                                            "font-bold",
                                            currentRisk.riskLevel === 'high' ? "text-red-800" : "text-orange-800"
                                        )}>
                                            {currentRisk.riskLevel === 'high' ? 'High Health Risk Detected' : 'Health Risk Detected'}
                                        </h3>
                                        <p className="text-sm text-slate-700 mt-1">{currentRisk.summary}</p>
                                        {currentRisk.referral && (
                                            <div className="mt-2 bg-white/60 p-2 rounded text-sm font-bold">
                                                Recommendation: {currentRisk.referral}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transcription */}
                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">जो आपने बोला:</p>
                            <p className="text-sm text-slate-700 italic">"{transcription}"</p>
                        </div>

                        {/* Verification Notice */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                                <AlertTriangle size={16} />
                                ⚠️ कृपया नीचे दी गई जानकारी जांचें और सही करें
                            </p>
                        </div>

                        {/* Editable Fields */}
                        <div className="space-y-3">
                            {/* Patient Name */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <User size={12} /> मरीज़ का नाम *
                                </label>
                                <input
                                    type="text"
                                    value={editedData.patient_name || patientName || ''}
                                    onChange={(e) => updateField('patient_name', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg text-sm"
                                    placeholder="मरीज़ का नाम"
                                />
                            </div>

                            {/* Visit Type */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Activity size={12} /> विज़िट का प्रकार
                                </label>
                                <select
                                    value={editedData.visit_type || ''}
                                    onChange={(e) => updateField('visit_type', e.target.value || null)}
                                    className="w-full mt-1 p-2 border rounded-lg text-sm"
                                >
                                    <option value="">चुनें...</option>
                                    <option value="routine_checkup">Routine Checkup</option>
                                    <option value="follow_up">Follow Up</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="vaccination">Vaccination</option>
                                </select>
                            </div>

                            {/* Vitals */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Stethoscope size={10} /> BP
                                    </label>
                                    <div className="flex gap-1 mt-1">
                                        <input
                                            type="number"
                                            value={editedData.vitals?.blood_pressure?.systolic || ''}
                                            onChange={(e) => updateVitals('blood_pressure', {
                                                ...editedData.vitals?.blood_pressure,
                                                systolic: parseInt(e.target.value) || null
                                            })}
                                            className="w-full p-2 border rounded-lg text-sm"
                                            placeholder="Sys"
                                        />
                                        <input
                                            type="number"
                                            value={editedData.vitals?.blood_pressure?.diastolic || ''}
                                            onChange={(e) => updateVitals('blood_pressure', {
                                                ...editedData.vitals?.blood_pressure,
                                                diastolic: parseInt(e.target.value) || null
                                            })}
                                            className="w-full p-2 border rounded-lg text-sm"
                                            placeholder="Dia"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Weight size={10} /> वज़न (kg)
                                    </label>
                                    <input
                                        type="number"
                                        value={editedData.vitals?.weight_kg || ''}
                                        onChange={(e) => updateVitals('weight_kg', parseFloat(e.target.value) || null)}
                                        className="w-full mt-1 p-2 border rounded-lg text-sm"
                                        placeholder="kg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Thermometer size={10} /> तापमान
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editedData.vitals?.temperature_celsius || ''}
                                        onChange={(e) => updateVitals('temperature_celsius', parseFloat(e.target.value) || null)}
                                        className="w-full mt-1 p-2 border rounded-lg text-sm"
                                        placeholder="°C"
                                    />
                                </div>
                            </div>

                            {/* Symptoms */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">लक्षण</label>
                                <input
                                    type="text"
                                    value={editedData.symptoms?.join(', ') || ''}
                                    onChange={(e) => updateField('symptoms', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    className="w-full mt-1 p-2 border rounded-lg text-sm"
                                    placeholder="लक्षण (कॉमा से अलग करें)"
                                />
                            </div>

                            {/* Observations */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">नोट्स / अवलोकन</label>
                                <textarea
                                    value={editedData.observations || ''}
                                    onChange={(e) => updateField('observations', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg text-sm"
                                    rows={2}
                                    placeholder="अतिरिक्त नोट्स..."
                                />
                            </div>

                            {/* Follow-up & Referral */}
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedData.follow_up_required || false}
                                        onChange={(e) => updateField('follow_up_required', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Follow-up ज़रूरी</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedData.referral_needed || false}
                                        onChange={(e) => updateField('referral_needed', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Referral ज़रूरी</span>
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleReRecord}
                                variant="outline"
                                className="flex-1"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                दोबारा रिकॉर्ड करें
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 bg-teal-600 hover:bg-teal-700"
                            >
                                <Save size={16} className="mr-2" />
                                सेव करें
                            </Button>
                        </div>
                    </div>
                )}

                {/* Saving State */}
                {state === 'saving' && (
                    <div className="text-center py-12">
                        <Loader2 size={48} className="animate-spin text-teal-600 mx-auto" />
                        <p className="text-slate-600 mt-4">सेव हो रहा है...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
