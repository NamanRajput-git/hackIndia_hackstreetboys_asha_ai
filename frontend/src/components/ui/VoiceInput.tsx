import { useState, useCallback } from 'react';
import { Mic, Loader2, Square, Volume2, Languages } from 'lucide-react';
import { clsx } from 'clsx';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { processVoiceInput } from '../../services/voiceAgent';
import { useStore } from '../../store/useStore';

interface VoiceInputProps {
  beneficiaryId?: string;
  className?: string;
  label?: string;
  labelHindi?: string;
  onTranscript?: (transcript: string) => void;
  onResponse?: (response: string) => void;
}

export default function VoiceInput({
  beneficiaryId,
  className,
  label = 'Tap to Speak',
  labelHindi = 'बोलने के लिए दबाएं',
  onTranscript,
  onResponse,
}: VoiceInputProps) {
  const { language, setLanguage } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const { state: recorderState, startRecording, stopRecording, resetRecording } = useVoiceRecorder();
  const { speak, stop: stopSpeaking, state: ttsState } = useTextToSpeech(language === 'hi' ? 'hi-IN' : 'en-US');

  const handlePress = useCallback(async () => {
    if (isProcessing) return;

    if (recorderState.isRecording) {
      // Stop recording and process
      const audioBlob = await stopRecording();
      if (!audioBlob) return;

      setIsProcessing(true);

      try {
        const result = await processVoiceInput(
          audioBlob,
          language,
          beneficiaryId
        );

        if (result) {
          onTranscript?.(result.transcript);
          onResponse?.(result.response);

          // Speak the response
          speak(result.response);
        }
      } catch (error) {
        console.error('Voice processing error:', error);
      } finally {
        setIsProcessing(false);
        resetRecording();
      }
    } else {
      // Start recording
      stopSpeaking();
      await startRecording();
    }
  }, [
    isProcessing,
    recorderState.isRecording,
    stopRecording,
    startRecording,
    resetRecording,
    beneficiaryId,
    language,
    speak,
    stopSpeaking,
    onTranscript,
    onResponse,
  ]);

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonState = () => {
    if (isProcessing) return 'processing';
    if (recorderState.isRecording) return 'recording';
    if (ttsState.isSpeaking) return 'speaking';
    return 'idle';
  };

  const buttonState = getButtonState();

  return (
    <div className={clsx('flex flex-col items-center gap-3', className)}>
      <button
        type="button"
        onClick={handlePress}
        disabled={isProcessing}
        className={clsx(
          'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200',
          'shadow-lg focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed',
          buttonState === 'recording' && 'bg-red-500 focus:ring-red-300 animate-pulse',
          buttonState === 'processing' && 'bg-indigo-500 focus:ring-indigo-300',
          buttonState === 'speaking' && 'bg-green-500 focus:ring-green-300',
          buttonState === 'idle' && 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-300',
        )}
      >
        {/* Ripple effect when recording */}
        {buttonState === 'recording' && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-pulse" />
          </>
        )}

        {/* Icon */}
        <span className="relative z-10 text-white">
          {buttonState === 'processing' ? (
            <Loader2 size={36} className="animate-spin" />
          ) : buttonState === 'recording' ? (
            <Square size={36} className="fill-current" />
          ) : buttonState === 'speaking' ? (
            <Volume2 size={36} />
          ) : (
            <Mic size={36} />
          )}
        </span>
      </button>

      {/* Label */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          {buttonState === 'processing'
            ? 'Processing...'
            : buttonState === 'recording'
              ? `Recording: ${formatDuration(recorderState.duration)}`
              : buttonState === 'speaking'
                ? 'Speaking...'
                : label}
        </p>
        <p className="text-xs text-gray-500 font-hindi">
          {buttonState === 'processing'
            ? 'प्रोसेसिंग...'
            : buttonState === 'recording'
              ? `रिकॉर्डिंग: ${formatDuration(recorderState.duration)}`
              : buttonState === 'speaking'
                ? 'बोल रही हूं...'
                : labelHindi}
        </p>
      </div>

      {/* Language Switcher */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        className="mt-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors border border-slate-200"
      >
        <Languages size={14} />
        {language === 'en' ? 'English' : 'हिंदी (Hindi)'}
      </button>

      {/* Waveform visualization when recording */}
      {buttonState === 'recording' && (
        <div className="flex items-center justify-center gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-rose-500 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 24 + 8}px`,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
