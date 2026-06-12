"use client"

import { Mic, MicOff } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CambVoice, VoiceConnectionState } from "@/hooks/use-voice-engine"

type Props = {
  state: VoiceConnectionState
  isActive: boolean
  error: string | null
  onStart: (voiceId: number | null) => void
  onStop: () => void
}

const STATE_LABEL: Record<VoiceConnectionState, string> = {
  idle: "Off",
  connecting: "Connecting…",
  ready: "Live",
  error: "Error",
  closed: "Stopped",
}

export function VoicePanel({ state, isActive, error, onStart, onStop }: Props) {
  const [voices, setVoices] = useState<CambVoice[]>([])
  const [voiceId, setVoiceId] = useState<string>("default")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/voice/list")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setVoices(data.voices ?? [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mic className="size-4 text-primary" />
          <h2 className="text-sm font-medium text-foreground">Voice changer</h2>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={`size-1.5 rounded-full ${
              state === "ready"
                ? "animate-pulse bg-primary"
                : "bg-muted-foreground"
            }`}
            aria-hidden="true"
          />
          {STATE_LABEL[state]}
        </span>
      </div>

      <p className="mt-2 text-pretty text-xs leading-relaxed text-muted-foreground">
        Swap your voice in real time using one of your cloned voices. Audio is
        converted live as you speak.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Select
          value={voiceId}
          onValueChange={(v) => setVoiceId(v ?? "default")}
          disabled={isActive || loading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={loading ? "Loading voices…" : "Select a voice"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Built-in voice</SelectItem>
            {voices.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {v.name}
                {v.gender ? ` · ${v.gender}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isActive ? (
          <Button
            variant="secondary"
            className="gap-2"
            onClick={onStop}
          >
            <MicOff className="size-4" />
            Stop voice
          </Button>
        ) : (
          <Button
            className="gap-2"
            onClick={() =>
              onStart(voiceId === "default" ? null : Number(voiceId))
            }
          >
            <Mic className="size-4" />
            Start voice
          </Button>
        )}
      </div>

      {voices.length === 0 && !loading && (
        <p className="mt-2 text-xs text-muted-foreground">
          No cloned voices found on your account. Create one in your Camb.ai
          dashboard, or use the built-in voice.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
