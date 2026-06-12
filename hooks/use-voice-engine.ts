"use client"

import { useCallback, useRef, useState } from "react"

export type VoiceConnectionState =
  | "idle"
  | "connecting"
  | "ready"
  | "error"
  | "closed"

export type CambVoice = {
  id: number
  name: string
  gender: string | null
  language: string | null
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    )
  }
  return btoa(binary)
}

function base64ToInt16(b64: string) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}

export function useVoiceEngine() {
  const [state, setState] = useState<VoiceConnectionState>("idle")
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const playCtxRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  // Scheduled playback cursor so converted audio plays back-to-back.
  const playHeadRef = useRef(0)

  const playPcm = useCallback((pcm: Int16Array) => {
    const ctx = playCtxRef.current
    if (!ctx) return
    const float = new Float32Array(pcm.length)
    for (let i = 0; i < pcm.length; i++) float[i] = pcm[i] / 0x8000
    const buffer = ctx.createBuffer(1, float.length, 24000)
    buffer.copyToChannel(float, 0)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    const now = ctx.currentTime
    const startAt = Math.max(now, playHeadRef.current)
    src.start(startAt)
    playHeadRef.current = startAt + buffer.duration
  }, [])

  const start = useCallback(
    async (opts: {
      voiceId?: number | null
      sourceLanguage?: string
      targetLanguage?: string
    }) => {
      setError(null)
      setState("connecting")
      try {
        // 1. Get the realtime socket credentials from our server.
        const credRes = await fetch("/api/voice/credentials", {
          method: "POST",
        })
        if (!credRes.ok) throw new Error("Could not get voice credentials.")
        const { apiKey, url } = await credRes.json()

        // 2. Set up the playback context for converted audio.
        const PlayCtx =
          window.AudioContext || (window as any).webkitAudioContext
        playCtxRef.current = new PlayCtx({ sampleRate: 24000 })
        playHeadRef.current = 0

        // 3. Open the Camb.ai realtime socket and send session.update first.
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: "session.update",
              session: {
                source_language: opts.sourceLanguage ?? "en-us",
                target_language: opts.targetLanguage ?? "en-us",
                output_modalities: ["audio"],
                ...(opts.voiceId
                  ? { voice: { type: "cloned", voice_id: opts.voiceId } }
                  : {}),
              },
              auth: { api_key: apiKey },
            }),
          )
        }

        ws.onmessage = (event) => {
          if (typeof event.data !== "string") return
          let msg: any
          try {
            msg = JSON.parse(event.data)
          } catch {
            return
          }
          switch (msg.type) {
            case "session.updated":
              setState("ready")
              break
            case "response.audio.delta":
              if (msg.audio) playPcm(base64ToInt16(msg.audio))
              break
            case "error":
              console.error("[v0] Camb error:", msg)
              setError(msg.error?.message ?? "Voice session error.")
              setState("error")
              break
            default:
              break
          }
        }

        ws.onerror = () => {
          setError("Voice connection error.")
          setState("error")
        }
        ws.onclose = () => {
          setState((s) => (s === "error" ? s : "closed"))
        }

        // 4. Capture the microphone and stream PCM16 frames to the socket.
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        })
        micStreamRef.current = micStream

        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new Ctx()
        ctxRef.current = ctx
        await ctx.audioWorklet.addModule("/voice-capture-processor.js")

        const source = ctx.createMediaStreamSource(micStream)
        sourceRef.current = source
        const worklet = new AudioWorkletNode(ctx, "capture-processor")
        workletRef.current = worklet

        worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
          if (ws.readyState !== WebSocket.OPEN) return
          ws.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: arrayBufferToBase64(e.data),
            }),
          )
        }

        source.connect(worklet)
        // Keep the graph alive without routing mic to speakers.
        worklet.connect(ctx.destination)
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to start voice changer."
        console.error("[v0] start voice failed:", message)
        setError(message)
        setState("error")
      }
    },
    [playPcm],
  )

  const stop = useCallback(() => {
    workletRef.current?.disconnect()
    sourceRef.current?.disconnect()
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close().catch(() => {})
    playCtxRef.current?.close().catch(() => {})
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }
    workletRef.current = null
    sourceRef.current = null
    micStreamRef.current = null
    ctxRef.current = null
    playCtxRef.current = null
    wsRef.current = null
    setState("idle")
  }, [])

  return {
    state,
    error,
    isActive: state === "connecting" || state === "ready",
    start,
    stop,
  }
}
