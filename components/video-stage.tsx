"use client"

import { Maximize2 } from "lucide-react"
import type { RefObject } from "react"
import type { VideoConnectionState } from "@/hooks/use-video-engine"

type Props = {
  localVideoRef: RefObject<HTMLVideoElement | null>
  remoteVideoRef: RefObject<HTMLVideoElement | null>
  state: VideoConnectionState
  isActive: boolean
}

const STATE_LABEL: Record<VideoConnectionState, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  connected: "Connected",
  generating: "Live",
  reconnecting: "Reconnecting…",
  disconnected: "Disconnected",
}

export function VideoStage({
  localVideoRef,
  remoteVideoRef,
  state,
  isActive,
}: Props) {
  const isLive = state === "generating" || state === "connected"

  return (
    <div className="grid w-full gap-3 md:grid-cols-2">
      {/* Raw camera */}
      <figure className="relative aspect-[9/16] overflow-hidden rounded-xl border border-border bg-card sm:aspect-video md:aspect-[3/4]">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="size-full object-cover"
        />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-pretty text-sm text-muted-foreground">
              Your camera preview appears here
            </p>
          </div>
        )}
        <figcaption className="absolute left-3 top-3 rounded-md bg-background/70 px-2 py-1 text-xs font-medium text-foreground backdrop-blur">
          You
        </figcaption>
      </figure>

      {/* Transformed output */}
      <figure className="relative aspect-[9/16] overflow-hidden rounded-xl border border-border bg-card sm:aspect-video md:aspect-[3/4]">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="size-full object-cover"
        />
        {!isLive && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-pretty text-sm text-muted-foreground">
              {isActive
                ? "Transforming your stream…"
                : "Your transformed self appears here"}
            </p>
          </div>
        )}
        <figcaption className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-background/70 px-2 py-1 text-xs font-medium text-foreground backdrop-blur">
          <span
            className={`size-1.5 rounded-full ${
              isLive ? "animate-pulse bg-primary" : "bg-muted-foreground"
            }`}
            aria-hidden="true"
          />
          {STATE_LABEL[state]}
        </figcaption>
        <button
          type="button"
          aria-label="Fullscreen transformed video"
          onClick={() => remoteVideoRef.current?.requestFullscreen?.()}
          className="absolute right-3 top-3 rounded-md bg-background/70 p-1.5 text-foreground backdrop-blur transition-colors hover:bg-background"
        >
          <Maximize2 className="size-4" />
        </button>
      </figure>
    </div>
  )
}
