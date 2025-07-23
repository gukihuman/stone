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

export const config = { runtime: "edge" }

function b64ToUint8(b64) {
  const bin = atob(b64)
  const len = bin.length
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function* evenByteChunks(source, decodeBase64 = false) {
  let carry = null
  let seq = 0

  for await (let part of source) {
    console.log(`[DBG‑EBC] in #${seq} rawLen=${part.length ?? part.byteLength}`)
    seq++

    let buf = decodeBase64 ? b64ToUint8(part) : part
    console.log(`[DBG‑EBC] decodedLen=${buf.byteLength}`)

    if (carry) {
      const merged = new Uint8Array(1 + buf.byteLength)
      merged[0] = carry[0]
      merged.set(buf, 1)
      buf = merged
      console.log(`[DBG‑EBC] prepended carry → len=${buf.byteLength}`)
      carry = null
    }

    const evenLen = buf.byteLength & ~1
    if (evenLen) {
      const slice = buf.subarray(0, evenLen)
      if (slice.byteLength & 1) console.error("[DBG‑EBC] ODD SLICE EMIT")
      console.log(`[DBG‑EBC] yield len=${slice.byteLength}`)
      yield slice
    }

    if (buf.byteLength & 1) {
      carry = buf.subarray(buf.byteLength - 1)
      console.log("[DBG‑EBC] stored carry")
    }
  }

  if (carry) {
    console.log("[DBG‑EBC] flush final carry (len=2)")
    yield Uint8Array.of(carry[0], 0)
  }
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
    if (!secret || !accessToken || accessToken !== secret)
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      })
    if (!text)
      return new Response(JSON.stringify({ error: "no text" }), { status: 400 })

    console.log(`[API TTS] provider=${provider}`)

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
      const { success, apiKey } = await oracleRes.json()
      if (!success) throw new Error("oracle failed")

      const prompt = [
        "<instructions>",
        ROXANNE_VOICE_INSTRUCTIONS,
        "</instructions>",
        "<text>",
        text,
        "</text>",
      ].join("\n")

      const ai = new GoogleGenAI({ apiKey })
      const ttsStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Leda" } },
          },
        },
      })

      ;(async () => {
        try {
          async function* audioParts(src) {
            let n = 0
            for await (const ch of src) {
              const b64 =
                ch?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
              console.log(`[DBG‑GEM] frame #${n} hasB64=${!!b64}`)
              n++
              if (b64) yield b64
            }
            console.log("[DBG‑GEM] stream finished")
          }

          const iter = evenByteChunks(audioParts(ttsStream), true)
          let outNo = 0
          for await (const buf of iter) {
            console.log(`[DBG‑PIPE] out #${outNo} len=${buf.byteLength}`)
            await writer.write(buf)
            outNo++
          }
          console.log("[DBG‑PIPE] writer.close()")
          await writer.close()
        } catch (e) {
          console.error("google pipe error:", e)
          await writer.abort(e)
        }
      })()
    } else if (provider === "openai") {
      const prompt = [
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
        input: prompt,
        instructions: ROXANNE_VOICE_INSTRUCTIONS,
        response_format: "pcm",
      })

      ;(async () => {
        try {
          const iter = evenByteChunks(ttsStream.body, false)
          let outNo = 0
          for await (const buf of iter) {
            console.log(`[DBG‑PIPE] openai #${outNo} len=${buf.byteLength}`)
            await writer.write(buf)
            outNo++
          }
          await writer.close()
        } catch (e) {
          console.error("openai pipe error:", e)
          await writer.abort(e)
        }
      })()
    } else {
      return new Response(JSON.stringify({ error: "invalid provider" }), {
        status: 400,
      })
    }

    return new Response(readable, {
      headers: {
        "Content-Type": "audio/L16; rate=24000; endian=little",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (e) {
    console.error("tts handler error:", e)
    return new Response(JSON.stringify({ error: "internal" }), { status: 500 })
  }
}
