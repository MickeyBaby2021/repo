import { NextResponse } from "next/server"

// Lists the cloned voices owned by the account so the user can pick a target
// voice for the live voice changer. Runs server-side with the secret key.
export async function GET() {
  if (!process.env.CAMB_API_KEY) {
    return NextResponse.json(
      { error: "CAMB_API_KEY is not configured.", voices: [] },
      { status: 500 },
    )
  }

  try {
    const res = await fetch("https://client.camb.ai/apis/list-voices", {
      headers: { "x-api-key": process.env.CAMB_API_KEY },
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("[v0] Camb list-voices failed:", res.status, text)
      return NextResponse.json(
        { error: "Failed to list voices.", voices: [] },
        { status: res.status },
      )
    }

    const data = await res.json()
    // Normalize: the API returns an array of voices with id + voice_name.
    const raw = Array.isArray(data) ? data : (data?.payload ?? data?.voices ?? [])
    const voices = (raw as any[]).map((v) => ({
      id: v.id ?? v.voice_id,
      name: v.voice_name ?? v.name ?? `Voice ${v.id ?? v.voice_id}`,
      gender: v.gender ?? null,
      language: v.language ?? null,
    }))

    return NextResponse.json({ voices })
  } catch (error) {
    console.error("[v0] Camb list-voices error:", error)
    return NextResponse.json(
      { error: "Failed to list voices.", voices: [] },
      { status: 500 },
    )
  }
}
