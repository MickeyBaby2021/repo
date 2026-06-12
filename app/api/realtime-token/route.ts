import { createDecartClient } from "@decartai/sdk"
import { NextResponse } from "next/server"

// Decart client tokens are short-lived and safe to use in the browser.
// The permanent DECART_API_KEY never leaves the server.
const client = createDecartClient({
  apiKey: process.env.DECART_API_KEY,
})

export async function POST() {
  if (!process.env.DECART_API_KEY) {
    return NextResponse.json(
      { error: "DECART_API_KEY is not configured." },
      { status: 500 },
    )
  }

  try {
    const token = await client.tokens.create({
      expiresIn: 300, // 5 minutes
      allowedModels: ["lucy-2.1"],
    })
    return NextResponse.json(token)
  } catch (error) {
    console.error("[v0] Decart token error:", error)
    return NextResponse.json(
      { error: "Failed to generate realtime token." },
      { status: 500 },
    )
  }
}
