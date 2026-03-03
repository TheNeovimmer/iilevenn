'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { encodeWav } from '@/lib/wav-encoder'

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'recorded'

interface UseVoiceRecorderReturn {
  state: RecorderState
  audioBlob: Blob | null
  elapsedMs: number
  analyserNode: AnalyserNode | null
  error: string | null
  startRecording: () => void
  stopRecording: () => void
  discard: () => void
}

const MAX_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setAnalyserNode(null)
    chunksRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  const startRecording = useCallback(async () => {
    setError(null)
    setState('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up AudioContext + Analyser for live visualization
      const ctx = new AudioContext()
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      setAnalyserNode(analyser)

      // Choose MIME type (Safari fallback)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : undefined // browser default (mp4 on Safari)

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        try {
          const recordedBlob = new Blob(chunksRef.current, {
            type: recorder.mimeType,
          })

          // Decode to PCM via AudioContext, then encode as WAV
          const decodeCtx = new AudioContext()
          const arrayBuffer = await recordedBlob.arrayBuffer()
          const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer)
          await decodeCtx.close()

          // Mix down to mono
          const pcm =
            audioBuffer.numberOfChannels === 1
              ? audioBuffer.getChannelData(0)
              : (() => {
                  const ch0 = audioBuffer.getChannelData(0)
                  const ch1 = audioBuffer.getChannelData(1)
                  const mono = new Float32Array(ch0.length)
                  for (let i = 0; i < ch0.length; i++) {
                    mono[i] = (ch0[i] + ch1[i]) / 2
                  }
                  return mono
                })()

          const wavBlob = encodeWav(pcm, audioBuffer.sampleRate)
          setAudioBlob(wavBlob)
          setState('recorded')
        } catch (err) {
          setError('Failed to process recording')
          setState('idle')
        }
      }

      recorder.start(250) // collect chunks every 250ms
      startTimeRef.current = Date.now()
      setState('recording')

      // Elapsed timer
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current)
      }, 100)

      // Auto-stop at max duration
      maxTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
          if (timerRef.current) clearInterval(timerRef.current)
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
          }
        }
      }, MAX_DURATION_MS)
    } catch (err) {
      cleanup()
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone permission and try again.'
          : 'Could not access microphone. Please check your device settings.'
      setError(msg)
      setState('idle')
    }
  }, [cleanup])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
    setElapsedMs(Date.now() - startTimeRef.current)

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setAnalyserNode(null)
  }, [])

  const discard = useCallback(() => {
    cleanup()
    setAudioBlob(null)
    setElapsedMs(0)
    setError(null)
    setState('idle')
  }, [cleanup])

  return {
    state,
    audioBlob,
    elapsedMs,
    analyserNode,
    error,
    startRecording,
    stopRecording,
    discard,
  }
}
