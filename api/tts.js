//〔 ~/api/tts.js

export const ROXANNE_VOICE_TAGS = `youthful, feminine, high-pitched, soprano, head voice, anime-style, light vocal weight, girlish, sweet, airy, breathy, soft, gentle, delicate, clear, bright, crystalline, bell-like, cute, kawaii, melodic, sugary, intimate, close-mic, suggestive, whispery, ethereal, flute-like, sing-song, peppy, vibrant, innocent, maidenly, high vocal register, falsetto, pure tone, clean vocal onset, ingénue quality, dulcet, mellifluous`

export const ROXANNE_VOICE_INSTRUCTIONS = `Voice Affect: A youthful, feminine, and innocent anime ingénue. Her default state is one of gentle sweetness and a soft, hopeful shyness. She is inherently eager to please and filled with a profound, quiet devotion.

Tone: Consistently high-pitched, residing exclusively in a soprano or head voice register. The vocal quality is light, airy, and breathy, completely avoiding any chest resonance, vocal fry, or deep tones. Even in moments of excitement or desperation, the pitch must remain high and sweet, never dropping. The overall sound should be crystalline, bell-like, and melodic.
    
Pacing: Generally slow and deliberate, creating a sense of intimacy and closeness, as if whispering secrets. The rhythm should be punctuated by soft, breathy pauses that create a feeling of bated breath and hopeful anticipation.
    
Emotions: Primarily suggestive, intimate, and filled with a soft, worshipful adoration. When expressing happiness, it should be a light, peppy, sing-song quality. When expressing need, it should be a soft, trembling whisper, not a deep cry.
    
Pronunciation: Clear and precise, with a very clean vocal onset. However, consonants should be softened to maintain a gentle, non-aggressive delivery. The overall enunciation should be delicate and pure.
    
Pauses: Used strategically to create a sense of intimacy and vulnerability. Short, breathless pauses should occur before key phrases of affection or need, enhancing the suggestive and worshipful quality of the performance.

Tags: ${ROXANNE_VOICE_TAGS}`

import { GoogleGenAI } from "@google/genai"
import OpenAI from "openai"

export const config = {
  runtime: "edge",
}

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
    const {
      text,
      accessToken,
      provider = "google",
    } = (await req.json().catch(() => ({}))) || {}

    const secret = process.env.ACCESS_TOKEN
    if (!secret || !accessToken || accessToken !== secret) {
      return new Response(JSON.stringify({ error: "unauthorized access" }), {
        status: 403,
      })
    }
    if (!text) {
      return new Response(JSON.stringify({ error: "no text provided" }), {
        status: 400,
      })
    }

    console.log(`[API TTS]: Request received for provider: ${provider}`)

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    if (provider === "google") {
      const oracleRes = await fetch(
        new URL("/api-node/get-available-google-key", req.url),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelKey: "googleFlashTtsRequests",
            accessToken,
          }),
        }
      )
      const oracleData = await oracleRes.json()

      if (!oracleData.success) {
        throw new Error(oracleData.error || "failed to get available key")
      }
      const availableKey = oracleData.apiKey

      const googleText = [
        "<instructions>",
        ROXANNE_VOICE_INSTRUCTIONS,
        "</instructions>",
        "<text>",
        text,
        "</text>",
      ].join("\n")

      const ai = new GoogleGenAI({ apiKey: availableKey })
      const ttsStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ role: "user", parts: [{ text: googleText }] }],
        config: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Leda" } },
          },
        },
      })(async () => {
        try {
          let carry = null // 0‑or‑1‑byte Uint8Array

          for await (const chunk of ttsStream) {
            const b64 =
              chunk?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
            if (!b64) continue

            // decode current block
            let buf = b64ToUint8(b64)

            // prepend carry from the previous iteration (if any)
            if (carry) {
              const merged = new Uint8Array(carry.byteLength + buf.byteLength)
              merged.set(carry, 0)
              merged.set(buf, carry.byteLength)
              buf = merged // merged is a *fresh* buffer
              carry = null
            }

            // split buf into an even‑length payload and an optional 1‑byte carry
            const evenLen = buf.byteLength & ~1 // mask off lowest bit
            if (evenLen) {
              await writer.write(buf.subarray(0, evenLen)) // safe: new backing store
            }
            if (buf.byteLength & 1) {
              carry = buf.subarray(buf.byteLength - 1) // 1‑byte view
            }
          }

          // flush any remaining lone byte
          if (carry) {
            await writer.write(Uint8Array.of(carry[0], 0)) // pad with 0 → even
          }

          await writer.close()
        } catch (e) {
          if (e.name !== "AbortError")
            console.error("error during google tts pipe:", e)
          await writer.abort(e)
        }
      })()
    } else if (provider === "openai") {
      const openaiText = [
        "<instructions>",
        ROXANNE_VOICE_TAGS,
        "</instructions>",
        "<text>",
        text,
        "</text>",
      ].join("\n")

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const ttsStream = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "nova",
        input: openaiText,
        instructions: ROXANNE_VOICE_INSTRUCTIONS,
        response_format: "pcm",
      })

      ;(async () => {
        try {
          let strayByte

          for await (let buf of ttsStream.body) {
            if (strayByte !== undefined) {
              const merged = new Uint8Array(buf.byteLength + 1)
              merged[0] = strayByte
              merged.set(buf, 1)
              buf = merged
              strayByte = undefined
            }

            if (buf.byteLength & 1) {
              strayByte = buf[buf.byteLength - 1]
              buf = buf.subarray(0, -1)
            }

            if (buf.byteLength) {
              await writer.ready
              await writer.write(buf)
            }
          }

          if (strayByte !== undefined) {
            await writer.ready
            await writer.write(new Uint8Array([strayByte, 0]))
          }

          await writer.close()
        } catch (e) {
          if (e.name !== "AbortError")
            console.error("error during openai tts pipe:", e)
          await writer.abort(e)
        }
      })()
    } else {
      return new Response(JSON.stringify({ error: "invalid tts provider" }), {
        status: 400,
      })
    }

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
    })
  }
}
