"use client"

import { useEffect, useRef, useState } from "react"
import { PromptBar } from "@/components/prompt-bar"
import { VideoStage } from "@/components/video-stage"
import { VoicePanel } from "@/components/voice-panel"
import { Button } from "@/components/ui/button"
import { useVideoEngine } from "@/hooks/use-video-engine"
import { useVoiceEngine } from "@/hooks/use-voice-engine"

function formatTime(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0")
  const s = (total % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

export function Studio() {
  const video = useVideoEngine()
  const voice = useVoiceEngine()
  const [seconds, setSeconds] = useState(0)
  const pendingPrompt = useRef<{ prompt: string; image: File | null } | null>(
    null,
  )

  // Session timer runs whenever the video stream is active.
  useEffect(() => {
    if (!video.isActive) {
      setSeconds(0)
      return
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [video.isActive])

  async function handlePrompt(prompt: string, image: File | null) {
    if (!video.isActive) {
      // First prompt starts the session with that transformation.
      pendingPrompt.current = { prompt, image }
      await video.start({ prompt, image })
    } else {
      await video.update({ prompt, image })
    }
  }

  function stopSession() {
    video.stop()
    if (voice.isActive) voice.stop()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-primary" aria-hidden="true" />
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Morph
          </h1>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Real-time video & voice
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-sm tabular-nums text-foreground"
            aria-label="Session time"
          >
            {formatTime(seconds)}
          </span>
          {video.isActive ? (
            <Button variant="destructive" size="sm" onClick={stopSession}>
              Stop session
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Not started</span>
          )}
        </div>
      </header>

      <VideoStage
        localVideoRef={video.localVideoRef}
        remoteVideoRef={video.remoteVideoRef}
        state={video.state}
        isActive={video.isActive}
      />

      {video.error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {video.error}
        </p>
      )}

      <PromptBar disabled={false} onSubmit={handlePrompt} />

      <VoicePanel
        state={voice.state}
        isActive={voice.isActive}
        error={voice.error}
        onStart={(voiceId) =>
          voice.start({
            voiceId,
            sourceLanguage: "en-us",
            targetLanguage: "en-us",
          })
        }
        onStop={voice.stop}
      />

      <p className="pb-4 text-center text-xs text-muted-foreground">
        Video by Decart Lucy 2.1 · Voice by Camb.ai · Everything runs live with
        no pre-recording.
      </p>
    </main>
  )
}
