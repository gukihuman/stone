//〔 ~/api/tts.js

import { GoogleGenAI } from "@google/genai"

export const config = {
  runtime: "edge",
}

//〔 NEW: fast, allocation-efficient base64 decoding.
function b64ToUint8(b64) {
  const bin = atob(b64)
  const len = bin.length
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i)
  return out
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  try {
    const { text, accessToken } = (await req.json().catch(() => ({}))) || {}

    //〔 auth and validation logic remains perfect.
    const secret = process.env.ACCESS_TOKEN
    if (!secret)
      return new Response(
        JSON.stringify({ error: "server configuration error" }),
        { status: 500 }
      )
    if (!accessToken || accessToken !== secret)
      return new Response(JSON.stringify({ error: "unauthorized access" }), {
        status: 403,
      })
    if (!text)
      return new Response(JSON.stringify({ error: "no text provided" }), {
        status: 400,
      })

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

    //〔 IMPORTANT: catch sync errors before creating the stream.
    let ttsStream
    try {
      ttsStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ role: "user", parts: [{ text }] }],
        config: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Leda" } },
          },
        },
      })
    } catch (e) {
      console.error("error initiating gemini stream:", e)
      return new Response(
        JSON.stringify({ error: "failed to start tts stream" }),
        { status: 500 }
      )
    }

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    //〔 NEW: handle client disconnects gracefully.
    const abortSignal = req.signal
    abortSignal.addEventListener("abort", () => {
      writer.abort("client disconnected")
      if (ttsStream.return) ttsStream.return()
    })
    ;(async () => {
      try {
        let carry //〔 NEW: buffer for the stray byte.

        for await (const chunk of ttsStream) {
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            let data = b64ToUint8(
              chunk.candidates[0].content.parts[0].inlineData.data
            )

            //〔 NEW: handle the stray byte to ensure perfect sample alignment.
            if (carry) {
              data = new Uint8Array([carry[0], ...data])
              carry = undefined
            }
            if (data.byteLength & 1) {
              // is odd
              carry = data.slice(-1)
              data = data.slice(0, -1)
            }

            if (data.byteLength > 0) {
              //〔 NEW: strict back-pressure handling.
              await writer.ready
              await writer.write(data)
            }
          }
        }
        await writer.close()
      } catch (e) {
        if (e.name !== "AbortError") {
          // AbortError is expected on disconnect.
          console.error("error during tts stream piping:", e)
        }
        await writer.abort(e)
      }
    })()

    return new Response(readable, {
      headers: {
        "Content-Type": "audio/L16; rate=24000",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("error in tts handler:", error)
    return new Response(JSON.stringify({ error: "internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }
}
