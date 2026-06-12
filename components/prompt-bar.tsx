"use client"

import { ArrowRight, ChevronLeft, ChevronRight, ImagePlus } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { PRESETS } from "@/lib/presets"

type Props = {
  disabled?: boolean
  onSubmit: (prompt: string, image: File | null) => void
}

export function PromptBar({ disabled, onSubmit }: Props) {
  const [text, setText] = useState("")
  const [imageName, setImageName] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(true)
  const imageRef = useRef<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  function submit() {
    if (disabled) return
    if (!text.trim() && !imageRef.current) return
    onSubmit(text.trim(), imageRef.current)
  }

  function scrollChips(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-border bg-card p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={2}
          placeholder="Describe what you want to become… e.g. Turn the person into Albert Einstein"
          className="w-full resize-none bg-transparent px-2 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              imageRef.current = file
              setImageName(file?.name ?? null)
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            {imageName ? "Image attached" : "Reference image"}
          </Button>

          <Button
            type="button"
            size="icon"
            className="rounded-full"
            disabled={disabled}
            onClick={submit}
            aria-label="Apply transformation"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowExamples((s) => !s)}
          className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {showExamples ? "Hide examples" : "Show examples"}
        </button>

        {showExamples && (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              aria-label="Scroll examples left"
              onClick={() => scrollChips(-1)}
              className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div
              ref={scrollRef}
              className="flex flex-1 gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setText(preset.prompt)
                    if (!disabled) onSubmit(preset.prompt, imageRef.current)
                  }}
                  className="shrink-0 whitespace-nowrap rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Scroll examples right"
              onClick={() => scrollChips(1)}
              className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
