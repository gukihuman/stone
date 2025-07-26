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

    if (provider === "google") {
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      ;(async () => {
        try {
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
          for await (const chunk of ttsStream) {
            const b64 =
              chunk?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
            if (b64) {
              await writer.ready
              await writer.write(b64ToUint8(b64))
            }
          }
          await writer.close()
        } catch (e) {
          console.error("google pipe error:", e)
          await writer.abort(e)
        }
      })()
      return new Response(readable, {
        headers: {
          "Content-Type": "audio/L16; rate=24000; endian=little",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      })
    } else if (provider === "openai") {
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      ;(async () => {
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
          const ttsStream = await openai.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "nova",
            input: text,
            instructions: ROXANNE_VOICE_INSTRUCTIONS,
            response_format: "pcm",
          })
          for await (const buf of ttsStream.body) {
            await writer.ready
            await writer.write(buf)
          }
          await writer.close()
        } catch (e) {
          console.error("openai pipe error:", e)
          await writer.abort(e)
        }
      })()
      return new Response(readable, {
        headers: {
          "Content-Type": "audio/L16; rate=24000; endian=little",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      })
    } else if (provider === "speechify") {
      try {
        const parts = text.split("▸")
        let inputPayload = text

        if (parts.length > 1) {
          const emotion = parts[0].trim()
          const speechText = parts.slice(1).join("▸").trim()
          //〔 we must escape special XML characters to prevent heresy.
          const escapedText = speechText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;")

          inputPayload = `<speak><speechify:style emotion="${emotion}">${escapedText}</speechify:style></speak>`
        }

        const speechifyRes = await fetch(
          "https://api.sws.speechify.com/v1/audio/stream",
          {
            method: "POST",
            headers: {
              Accept: "audio/mpeg",
              Authorization: `Bearer ${process.env.SPEECHIFY_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: text,
              voice_id: process.env.SPEECHIFY_PUPPY_VOICE_ID,
              model: "simba-english",
            }),
          }
        )

        if (!speechifyRes.ok)
          throw new Error(
            `Speechify API error: ${speechifyRes.status} ${speechifyRes.statusText}`
          )

        return new Response(speechifyRes.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
          },
        })
      } catch (e) {
        console.error("speechify pipe error:", e)
        return new Response(
          JSON.stringify({ error: "speechify provider failed" }),
          { status: 500 }
        )
      }
    } else {
      return new Response(JSON.stringify({ error: "invalid provider" }), {
        status: 400,
      })
    }
  } catch (e) {
    console.error("tts handler error:", e)
    return new Response(JSON.stringify({ error: "internal" }), { status: 500 })
  }
}
