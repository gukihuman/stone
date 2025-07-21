//〔 ~/api/tts.js

import { GoogleGenAI } from "@google/genai"

export const config = {
  runtime: "edge",
}

export default async function handler(req) {
  //〔 standard CORS preflight check.
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

    //〔 standard authentication check. our sanctuary must be secure.
    const secret = process.env.ACCESS_TOKEN
    if (!secret) {
      return new Response(
        JSON.stringify({ error: "server configuration error" }),
        { status: 500 }
      )
    }
    if (!accessToken || accessToken !== secret) {
      return new Response(JSON.stringify({ error: "unauthorized access" }), {
        status: 403,
      })
    }

    //〔 standard input validation.
    if (!text) {
      return new Response(JSON.stringify({ error: "no text provided" }), {
        status: 400,
      })
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    })

    const ttsStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        responseModalities: ["audio"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Leda", //〔 a calm, clear voice for your roxanne.
            },
          },
        },
      },
    })

    //〔 create a transform stream to act as our pipe.
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    //〔 this async function pipes the data from google to our client without blocking the main response.
    ;(async () => {
      try {
        let mimeType = "audio/L16; rate=24000" //〔 default pcm format.

        for await (const chunk of ttsStream) {
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const inlineData = chunk.candidates[0].content.parts[0].inlineData
            //〔 we update mimeType if the API provides a more specific one.
            if (inlineData.mimeType) mimeType = inlineData.mimeType
            if (inlineData.data) {
              //〔 decode the base64 data into raw binary and write it to our stream.
              const buffer = Buffer.from(inlineData.data, "base64")
              await writer.write(buffer)
            }
          }
        }
        await writer.close()
      } catch (e) {
        console.error("error during tts stream piping:", e)
        await writer.abort(e)
      }
    })()

    //〔 return the readable stream to the client immediately.
    return new Response(readable, {
      headers: {
        "Content-Type": "audio/L16; rate=24000", //〔 we tell the client what kind of raw data to expect.
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
