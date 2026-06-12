"use client"

import { createDecartClient, models } from "@decartai/sdk"
import { useCallback, useRef, useState } from "react"

function describeMediaError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return "Camera/microphone permission denied. Please allow access in your browser settings."
    }
    if (err.name === "NotFoundError") {
      return "No camera or microphone found. Please connect a device and try again."
    }
    if (err.name === "OverconstrainedError") {
      return "Your camera doesn't support the required resolution. Try a different camera."
    }
    return `${err.name}: ${err.message}`
  }
  return String(err)
}

export type VideoConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "generating"
  | "reconnecting"
  | "disconnected"

type RealtimeClient = Awaited<
  ReturnType<ReturnType<typeof createDecartClient>["realtime"]["connect"]>
>

export function useVideoEngine() {
  const [state, setState] = useState<VideoConnectionState>("idle")
  const [error, setError] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const clientRef = useRef<RealtimeClient | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  const start = useCallback(
    async (opts: { prompt?: string; image?: Blob | string | null }) => {
      setError(null)
      setState("connecting")
      try {
        // 1. Mint a short-lived client token from our server.
        const tokenRes = await fetch("/api/realtime-token", { method: "POST" })
        if (!tokenRes.ok) throw new Error("Could not get a realtime token.")
        const { apiKey } = await tokenRes.json()
        if (!apiKey) throw new Error("Realtime token missing from response.")

        // 2. Get the camera + mic stream at the model's preferred resolution.
        const model = models.realtime("lucy-2.1")
        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
              frameRate: model.fps,
              width: model.width,
              height: model.height,
              facingMode: "user",
            },
          })
        } catch (mediaErr) {
          throw new Error(describeMediaError(mediaErr))
        }
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // 3. Connect to Decart's realtime engine over WebRTC.
        const client = createDecartClient({ apiKey })
        const realtimeClient = await client.realtime.connect(stream, {
          model,
          mirror: "auto",
          onRemoteStream: (transformedStream: MediaStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = transformedStream
            }
          },
          initialState: {
            prompt: opts.prompt
              ? { text: opts.prompt, enhance: true }
              : undefined,
            image: opts.image ?? undefined,
          },
        })

        clientRef.current = realtimeClient

        realtimeClient.on("connectionChange", (s: VideoConnectionState) => {
          setState(s)
        })
        realtimeClient.on("error", (e: { code?: string; message: string }) => {
          console.error("[v0] Decart error:", e.code, e.message)
          setError(e.message)
        })

        setState(realtimeClient.isConnected() ? "connected" : "connecting")
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to start video."
        console.error("[v0] start video failed:", message)
        setError(message)
        setState("idle")
        localStreamRef.current?.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }
    },
    [],
  )

  // Atomically replace the transformation state (prompt and/or reference image).
  const update = useCallback(
    async (next: { prompt?: string; image?: Blob | string | null }) => {
      const client = clientRef.current
      if (!client) return
      try {
        await client.set({
          prompt: next.prompt,
          image: next.image ?? undefined,
          enhance: true,
        })
      } catch (e) {
        console.error("[v0] update transform failed:", e)
      }
    },
    [],
  )

  const stop = useCallback(() => {
    clientRef.current?.disconnect()
    clientRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setState("idle")
  }, [])

  return {
    state,
    error,
    isActive: state !== "idle" && state !== "disconnected",
    localVideoRef,
    remoteVideoRef,
    start,
    update,
    stop,
  }
}
