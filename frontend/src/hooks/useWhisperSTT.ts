'use client'

import { useState, useCallback } from 'react'
import apiClient from '../lib/api'

interface UseWhisperSTTReturn {
    isProcessing: boolean
    transcript: string
    language: string
    error: string | null
    processAudio: (audioBlob: Blob, language?: string) => Promise<string | null>
    resetTranscript: () => void
    isSupported: boolean
}

export function useWhisperSTT(): UseWhisperSTTReturn {
    const [isProcessing, setIsProcessing] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [language, setLanguage] = useState('hi')
    const [error, setError] = useState<string | null>(null)
    const [isSupported] = useState(true)

    const processAudio = useCallback(async (audioBlob: Blob, lang?: string): Promise<string | null> => {
        setIsProcessing(true)
        setError(null)
        setTranscript('')

        try {
            // Create FormData for API request
            const formData = new FormData()

            // Determine file extension based on blob type
            const mimeType = audioBlob.type || 'audio/webm'
            let extension = 'webm'
            if (mimeType.includes('mp4')) extension = 'mp4'
            else if (mimeType.includes('wav')) extension = 'wav'
            else if (mimeType.includes('ogg')) extension = 'ogg'

            formData.append('audio', audioBlob, `recording.${extension}`)

            // Add language if provided
            if (lang) {
                formData.append('language', lang)
            }

            console.log('[WhisperSTT] Sending audio to transcription API...', {
                size: audioBlob.size,
                type: mimeType,
                language: lang
            })

            // Send to our backend Whisper endpoint
            const response = await apiClient.post('/voice/transcribe', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 60000, // 60 second timeout for transcription
            })

            const result = response.data

            if (result.error) {
                throw new Error(result.error)
            }

            console.log('[WhisperSTT] Transcription result:', result)

            const transcriptText = result.transcript || ''
            const detectedLang = result.language || lang || 'hi'

            setTranscript(transcriptText)
            setLanguage(detectedLang)

            return transcriptText

        } catch (err) {
            console.error('[WhisperSTT] Error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to transcribe audio'
            setError(errorMessage)
            setTranscript('')
            return null
        } finally {
            setIsProcessing(false)
        }
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setLanguage('hi')
        setError(null)
    }, [])

    return {
        isProcessing,
        transcript,
        language,
        error,
        processAudio,
        resetTranscript,
        isSupported,
    }
}

export default useWhisperSTT
