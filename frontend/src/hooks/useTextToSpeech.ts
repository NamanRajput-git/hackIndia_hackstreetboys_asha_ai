'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface TextToSpeechState {
    isSpeaking: boolean
    isPaused: boolean
    isSupported: boolean
    voices: SpeechSynthesisVoice[]
    currentVoice: SpeechSynthesisVoice | null
}

interface UseTextToSpeechReturn {
    state: TextToSpeechState
    speak: (text: string) => void
    pause: () => void
    resume: () => void
    stop: () => void
    setVoice: (voice: SpeechSynthesisVoice) => void
    setRate: (rate: number) => void
    setPitch: (pitch: number) => void
}

export function useTextToSpeech(language: string = 'hi-IN'): UseTextToSpeechReturn {
    const [state, setState] = useState<TextToSpeechState>({
        isSpeaking: false,
        isPaused: false,
        isSupported: false,
        voices: [],
        currentVoice: null,
    })

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const rateRef = useRef<number>(1.0)
    const pitchRef = useRef<number>(1.0)

    // Load voices with priority: Google > Microsoft > Female Hindi > Default
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setState(prev => ({ ...prev, isSupported: true }))

            const selectBestVoice = (voices: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice | null => {
                const langPrefix = langCode.split('-')[0]

                // Filter voices for the target language
                const langVoices = voices.filter(v =>
                    v.lang.startsWith(langPrefix) || v.lang.toLowerCase().includes(langPrefix)
                )

                // Priority 1: Google voices (best quality for Indian languages)
                const googleVoice = langVoices.find(v =>
                    v.name.toLowerCase().includes('google')
                )
                if (googleVoice) return googleVoice

                // Priority 2: Microsoft voices
                const microsoftVoice = langVoices.find(v =>
                    v.name.toLowerCase().includes('microsoft') || v.name.toLowerCase().includes('azure')
                )
                if (microsoftVoice) return microsoftVoice

                // Priority 3: Female Hindi voices (for Asha Didi persona)
                const femaleVoice = langVoices.find(v =>
                    v.name.toLowerCase().includes('female') ||
                    v.name.toLowerCase().includes('lekha') ||
                    v.name.toLowerCase().includes('aditi') ||
                    v.name.toLowerCase().includes('raveena') ||
                    v.name.toLowerCase().includes('swara')
                )
                if (femaleVoice) return femaleVoice

                // Priority 4: Any voice for the language
                if (langVoices.length > 0) return langVoices[0]

                // Priority 5: English fallback
                const englishVoice = voices.find(v => v.lang.startsWith('en'))
                if (englishVoice) return englishVoice

                // Priority 6: First available
                return voices[0] || null
            }

            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices()
                const preferredVoice = selectBestVoice(availableVoices, language)

                setState(prev => ({
                    ...prev,
                    voices: availableVoices,
                    currentVoice: preferredVoice,
                }))

                if (availableVoices.length > 0) {
                    console.log('[TTS] Loaded voices:', availableVoices.length)
                    console.log('[TTS] Selected voice:', preferredVoice?.name, preferredVoice?.lang)
                }
            }

            // Load voices (may be async in some browsers)
            loadVoices()
            window.speechSynthesis.onvoiceschanged = loadVoices
        }
    }, [language])

    // Update voice when language changes
    useEffect(() => {
        if (state.voices.length > 0) {
            const langPrefix = language.split('-')[0]

            // Find best voice for new language
            const googleVoice = state.voices.find(v =>
                v.lang.startsWith(langPrefix) && v.name.toLowerCase().includes('google')
            )
            const matchingVoice = googleVoice || state.voices.find(v =>
                v.lang.startsWith(langPrefix)
            )

            if (matchingVoice) {
                setState(prev => ({ ...prev, currentVoice: matchingVoice }))
            }
        }
    }, [language, state.voices])

    // Clean text for speech - remove markdown, emojis, and special characters
    const cleanTextForSpeech = (text: string): string => {
        return text
            // Remove markdown bold/italic markers
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/__/g, '')
            .replace(/_/g, ' ')
            // Remove markdown headers
            .replace(/#{1,6}\s*/g, '')
            // Remove markdown links [text](url) -> text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove emojis
            .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{1FA00}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, '')
            // Remove bullet points
            .replace(/^[\s]*[-•]\s*/gm, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            .trim()
    }

    const speak = useCallback((text: string) => {
        if (!state.isSupported || !text) return

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        // Clean the text before speaking
        const cleanedText = cleanTextForSpeech(text)
        if (!cleanedText) return

        console.log('[TTS] Speaking:', cleanedText.substring(0, 100) + '...')

        const utterance = new SpeechSynthesisUtterance(cleanedText)
        utterance.rate = rateRef.current
        utterance.pitch = pitchRef.current

        if (state.currentVoice) {
            utterance.voice = state.currentVoice
            utterance.lang = state.currentVoice.lang
        }

        utterance.onstart = () => {
            console.log('[TTS] Started speaking')
            setState(prev => ({ ...prev, isSpeaking: true, isPaused: false }))
        }

        utterance.onend = () => {
            console.log('[TTS] Finished speaking')
            setState(prev => ({ ...prev, isSpeaking: false, isPaused: false }))
        }

        utterance.onerror = (event) => {
            console.error('[TTS] Error:', event.error)
            setState(prev => ({ ...prev, isSpeaking: false, isPaused: false }))
        }

        utterance.onpause = () => {
            setState(prev => ({ ...prev, isPaused: true }))
        }

        utterance.onresume = () => {
            setState(prev => ({ ...prev, isPaused: false }))
        }

        utteranceRef.current = utterance
        window.speechSynthesis.speak(utterance)
    }, [state.isSupported, state.currentVoice])

    const pause = useCallback(() => {
        if (state.isSupported && state.isSpeaking) {
            window.speechSynthesis.pause()
        }
    }, [state.isSupported, state.isSpeaking])

    const resume = useCallback(() => {
        if (state.isSupported && state.isPaused) {
            window.speechSynthesis.resume()
        }
    }, [state.isSupported, state.isPaused])

    const stop = useCallback(() => {
        if (state.isSupported) {
            window.speechSynthesis.cancel()
            setState(prev => ({ ...prev, isSpeaking: false, isPaused: false }))
        }
    }, [state.isSupported])

    const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
        setState(prev => ({ ...prev, currentVoice: voice }))
    }, [])

    const setRate = useCallback((rate: number) => {
        rateRef.current = Math.max(0.5, Math.min(2, rate))
    }, [])

    const setPitch = useCallback((pitch: number) => {
        pitchRef.current = Math.max(0.5, Math.min(2, pitch))
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel()
            }
        }
    }, [])

    return {
        state,
        speak,
        pause,
        resume,
        stop,
        setVoice,
        setRate,
        setPitch,
    }
}

export default useTextToSpeech
