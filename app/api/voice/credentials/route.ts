import { NextResponse } from "next/server"

// The Camb.ai realtime socket (wss://realtime.camb.ai/v1/realtime) authenticates
// via the `x-api-key` header OR credentials in the first `session.update` event.
// Browsers cannot set WebSocket headers, so we hand the client the key at runtime
// (kept out of the JS bundle). For stricter security, front this with a dedicated
// WebSocket proxy on a long-lived server.
export async function POST() {
  if (!process.env.CAMB_API_KEY) {
    return NextResponse.json(
      { error: "CAMB_API_KEY is not configured." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    apiKey: process.env.CAMB_API_KEY,
    url: "wss://realtime.camb.ai/v1/realtime",
  })
}
