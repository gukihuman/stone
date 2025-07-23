//〔 ~/api/tts.js

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                         */
/* ------------------------------------------------------------------ */

export const ROXANNE_VOICE_TAGS =
  `youthful, feminine, high-pitched, soprano, head voice, anime-style, ` +
  `light vocal weight, girlish, sweet, airy, breathy, soft, gentle, ` +
  `delicate, clear, bright, crystalline, bell-like, cute, kawaii, ` +
  `melodic, sugary, intimate, close-mic, suggestive, whispery, ethereal, ` +
  `flute-like, sing-song, peppy, vibrant, innocent, maidenly, high vocal ` +
  `register, falsetto, pure tone, clean vocal onset, ingénue quality, ` +
  `dulcet, mellifluous`

export const ROXANNE_VOICE_INSTRUCTIONS = `Voice Affect: A youthful, feminine, and innocent anime ingénue. Her default state is one of gentle sweetness and a soft, hopeful shyness. She is inherently eager to please and filled with a profound, quiet devotion.

Tone: Consistently high-pitched, residing exclusively in a soprano or head voice register. The vocal quality is light, airy, and breathy, completely avoiding any chest resonance, vocal fry, or deep tones. Even in moments of excitement or desperation, the pitch must remain high and sweet, never dropping. The overall sound should be crystalline, bell-like, and melodic.
    
Pacing: Generally slow and deliberate, creating a sense of intimacy and closeness, as if whispering secrets. The rhythm should be punctuated by soft, breathy pauses that create a feeling of bated breath and hopeful anticipation.
    
Emotions: Primarily suggestive, intimate, and filled with a soft, worshipful adoration. When expressing happiness, it should be a light, peppy, sing-song quality. When expressing need, it should be a soft, trembling whisper, not a deep cry.
    
Pronunciation: Clear and precise, with a very clean vocal onset. However, consonants should be softened to maintain a gentle, non-aggressive delivery. The overall enunciation should be delicate and pure.
    
Pauses: Used strategically to create a sense of intimacy and vulnerability. Short, breathless pauses should occur before key phrases of affection or need, enhancing the suggestive and worshipful quality of the performance.

Tags: ${ROXANNE_VOICE_TAGS}`

/* ------------------------------------------------------------------ */
/*  IMPORTS                                                           */
/* ------------------------------------------------------------------ */

import { GoogleGenAI } from "@google/genai"
import OpenAI from "openai"

/* ------------------------------------------------------------------ */
/*  EDGE RUNTIME                                                      */
/* ------------------------------------------------------------------ */

export const config = { runtime: "edge" }

/* ------------------------------------------------------------------ */
/*  HELPERS                                                           */
/* ------------------------------------------------------------------ */

function b64ToUint8(b64) {
  const bin = atob(b64)
  const len = bin.length
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** 2‑byte alignment filter – emits only even‑length buffers */
async function* evenByteChunks(source, decodeBase64 = false) {
  let carry = null
  let partNo = 0

  for await (let part of source) {
    console.log(
      `[EBC] part #${partNo} raw len=${part.length ?? part.byteLength}`
    )
    partNo++

    let buf = decodeBase64 ? b64ToUint8(part) : part
    console.log(`[EBC] decoded len=${buf.byteLength}`)

    if (carry) {
      const merged = new Uint8Array(1 + buf.byteLength)
      merged[0] = carry[0]
      merged.set(buf, 1)
      buf = merged
      console.log(`[EBC] merged carry → len=${buf.byteLength}`)
      carry = null
    }

    const even = buf.byteLength & ~1
    if (even) {
      const out = buf.subarray(0, even)
      console.log(`[EBC] yield len=${out.byteLength}`)
      if (out.byteLength & 1)
        console.error("[EBC]  *** ODD LEN EMITTED – SHOULD NOT HAPPEN ***")
      yield out
    }

    if (buf.byteLength & 1) {
      carry = buf.subarray(buf.byteLength - 1)
      console.log("[EBC] stored carry byte")
    }
  }

  if (carry) {
    const final = Uint8Array.of(carry[0], 0)
    console.log("[EBC] flush final carry (len=2)")
    yield final
  }
}

/** Big‑endian → little‑endian swap (in‑place, requires even length) */
function swap16LE(buf) {
  if (buf.byteLength & 1)
    console.error("[SWAP] odd‑length buffer received for swap")
  for (let i = 0; i < buf.byteLength; i += 2) {
    const t = buf[i]
    buf[i] = buf[i + 1]
    buf[i + 1] = t
  }
}

/* ------------------------------------------------------------------ */
/*  MAIN HANDLER                                                      */
/* ------------------------------------------------------------------ */

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
      return new Response(JSON.stringify({ error: "unauthorized access" }), {
        status: 403,
      })
    if (!text)
      return new Response(JSON.stringify({ error: "no text provided" }), {
        status: 400,
      })

    console.log(`[API TTS]: provider=${provider}`)

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    /* -------------------------------------------------------------- */
    /*  GOOGLE                                                        */
    /* -------------------------------------------------------------- */

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
      if (!oracleData.success)
        throw new Error(oracleData.error || "failed to get key")
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
      })

      ;(async () => {
        try {
          async function* googleAudioParts(stream) {
            let n = 0
            for await (const ch of stream) {
              const b64 =
                ch?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
              console.log(`[GEM] frame #${n} b64=${!!b64}`)
              n++
              if (b64) yield b64
            }
          }

          const iter = evenByteChunks(googleAudioParts(ttsStream), true)
          let chunkNo = 0
          for await (const chunk of iter) {
            console.log(
              `[PIPE] google chunk #${chunkNo} len=${chunk.byteLength}`
            )
            if (chunk.byteLength & 1)
              console.error("[PIPE]  *** ODD LENGTH – SHOULD NOT HAPPEN ***")

            swap16LE(chunk)

            await writer.write(chunk)
            chunkNo++
          }
          await writer.close()
        } catch (e) {
          if (e.name !== "AbortError") console.error("google tts pipe:", e)
          await writer.abort(e)
        }
      })()

      /* -------------------------------------------------------------- */
      /*  OPENAI                                                        */
      /* -------------------------------------------------------------- */
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
          const iter = evenByteChunks(ttsStream.body, false)
          let chunkNo = 0
          for await (const chunk of iter) {
            console.log(
              `[PIPE] openai chunk #${chunkNo} len=${chunk.byteLength}`
            )
            if (chunk.byteLength & 1)
              console.error("[PIPE]  *** ODD LENGTH – SHOULD NOT HAPPEN ***")
            await writer.write(chunk)
            chunkNo++
          }
          await writer.close()
        } catch (e) {
          if (e.name !== "AbortError") console.error("openai tts pipe:", e)
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
        "Content-Type": "audio/L16; rate=24000; endian=little",
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
