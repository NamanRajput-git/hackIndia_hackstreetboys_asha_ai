import { useState, useRef, useCallback, useEffect } from 'react';

export interface VoiceRecordingState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
    error: string | null;
}

interface UseVoiceRecorderReturn {
    state: VoiceRecordingState;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<Blob | null>;
    pauseRecording: () => void;
    resumeRecording: () => void;
    resetRecording: () => void;
    isSupported: boolean;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
    const [state, setState] = useState<VoiceRecordingState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<number | null>(null);
    const isSupported = typeof window !== 'undefined' && 'MediaRecorder' in window;

    // Cleanup function
    const cleanup = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
    }, []);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            cleanup();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                }
            });

            streamRef.current = stream;

            // Prefer webm, fallback to mp4
            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : MediaRecorder.isTypeSupported('audio/mp4')
                    ? 'audio/mp4'
                    : 'audio/ogg';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start(100); // Collect data every 100ms

            setState(prev => ({
                ...prev,
                isRecording: true,
                isPaused: false,
                duration: 0,
                error: null,
                audioBlob: null,
                audioUrl: null,
            }));

            // Start duration timer after state is set
            timerRef.current = window.setInterval(() => {
                setState(prev => ({
                    ...prev,
                    duration: prev.duration + 1
                }));
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to start recording',
            }));
        }
    }, [cleanup]);

    // Stop recording
    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                resolve(null);
                return;
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: mediaRecorderRef.current?.mimeType || 'audio/webm'
                });
                const audioUrl = URL.createObjectURL(audioBlob);

                setState(prev => ({
                    ...prev,
                    isRecording: false,
                    isPaused: false,
                    audioBlob,
                    audioUrl,
                }));

                cleanup();
                resolve(audioBlob);
            };

            mediaRecorderRef.current.stop();
        });
    }, [cleanup]);

    // Pause recording
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setState(prev => ({
                ...prev,
                isPaused: true,
            }));
        }
    }, []);

    // Resume recording
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            timerRef.current = window.setInterval(() => {
                setState(prev => ({
                    ...prev,
                    duration: prev.duration + 1
                }));
            }, 1000);
            setState(prev => ({
                ...prev,
                isPaused: false,
            }));
        }
    }, []);

    // Reset recording
    const resetRecording = useCallback(() => {
        cleanup();
        setState({
            isRecording: false,
            isPaused: false,
            duration: 0,
            audioBlob: null,
            audioUrl: null,
            error: null,
        });
    }, [cleanup]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
            if (state.audioUrl) {
                URL.revokeObjectURL(state.audioUrl);
            }
        };
    }, [cleanup, state.audioUrl]);

    return {
        state,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
        isSupported,
    };
}

export default useVoiceRecorder;
