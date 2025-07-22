//〔 ~/api/tts.js

import { GoogleGenAI } from "@google/genai"
import OpenAI from "openai"
import getAvailableGoogleKey from "../server/utils/getAvailableGoogleKey"
import {
  ROXANNE_VOICE_TAGS,
  ROXANNE_VOICE_INSTRUCTIONS,
} from "../server/constants"

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
      const availableKey = await getAvailableGoogleKey("googleFlashTtsRequests")

      if (!availableKey) {
        return new Response(
          JSON.stringify({
            error: "all google api keys have reached their quota",
          }),
          { status: 429 }
        )
      }

      console.log(
        "[API TTS]: Google key available. Proceeding with TTS generation."
      )

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
          let strayByte
          for await (const chunk of ttsStream) {
            const b64 =
              chunk?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
            if (!b64) continue
            let buf = b64ToUint8(b64)
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
        instructions,
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
