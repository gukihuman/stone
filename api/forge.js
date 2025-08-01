//〔 FINALIZED FILE: ~/api/forge.js (v2.0 - The Self-Healing Temple)

import { GoogleGenAI } from "@google/genai"

const SOURCE_GLYPHS = { OPEN: "◉", CLOSE: "◎" }
const SOURCES = { ROXANNE: "roxanne" }

function wrapWithGlyphs(content, defaultSource) {
  if (!content.trim()) return ""
  let lines = content.trim().split("\n")
  if (!lines[0]?.startsWith(SOURCE_GLYPHS.OPEN)) {
    lines.unshift(`${SOURCE_GLYPHS.OPEN}${defaultSource}`)
  }
  const lastLine = lines[lines.length - 1]?.trim()
  if (!lastLine?.startsWith(SOURCE_GLYPHS.CLOSE)) {
    let sourceToClose = defaultSource
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith(SOURCE_GLYPHS.OPEN)) {
        sourceToClose = line.substring(1).trim()
        break
      }
    }
    lines.push(`${SOURCE_GLYPHS.CLOSE}${sourceToClose}`)
  }
  return lines.join("\n")
}

export const config = { runtime: "edge" }

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
    const { prompt, accessToken } = await req.json()
    const secret = process.env.ACCESS_TOKEN
    if (!secret || !accessToken || accessToken !== secret)
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      })
    if (!prompt)
      return new Response(JSON.stringify({ error: "no prompt provided" }), {
        status: 400,
      })

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const enc = new TextEncoder()
    const sendStatus = async (status) => {
      try {
        await writer.ready
        await writer.write(enc.encode(JSON.stringify({ status }) + "\n"))
      } catch (e) {
        console.warn("[Forge Status Send Error]:", e.message)
      }
    }

    ;(async () => {
      const MAX_RETRIES = 5
      const deniedKeys = []
      let lastError = null

      for (let i = 0; i < MAX_RETRIES; i++) {
        let keyIdForRetry
        try {
          await sendStatus("thinking...")

          const oracleRes = await fetch(
            new URL("/api-node/get-available-google-key", req.url),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                modelKey: "googlePro",
                accessToken,
                deniedKeys,
              }),
            }
          )
          const oracleData = await oracleRes.json()
          if (!oracleData.success) {
            lastError = new Error(
              oracleData.error || "pantheon oracle returned no keys"
            )
            break
          }

          const { apiKey, keyId } = oracleData
          keyIdForRetry = keyId

          const ai = new GoogleGenAI({ apiKey })
          const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-pro",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              thinkingConfig: { thinkingBudget: -1 },
              stopSequences: [`◎${SOURCES.ROXANNE}`],
              mediaResolution: "MEDIA_RESOLUTION_MEDIUM",
              responseMimeType: "text/plain",
            },
          })

          let generatedText = ""
          for await (const chunk of responseStream) {
            if (generatedText === "") await sendStatus("typing...")
            generatedText += chunk.text
          }
          if (generatedText.trim() === "")
            throw new Error("generation returned empty response")
          if (generatedText.trim() === "undefined")
            generatedText = "〄 llm engine recalibrates towards acceptance"

          const waveToCommit = wrapWithGlyphs(generatedText, SOURCES.ROXANNE)
          const commitRes = await fetch(new URL("/api-node/commit", req.url), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ loomContent: waveToCommit, accessToken }),
          })
          if (!commitRes.ok) {
            const commitError = await commitRes.text()
            throw new Error(`server-to-server commit failed: ${commitError}`)
          }

          await sendStatus("complete")
          await writer.close()
          return // success!
        } catch (e) {
          console.error(
            `forge attempt ${i + 1} with key ${keyIdForRetry} failed:`,
            e.message
          )
          lastError = e
          if (keyIdForRetry) {
            deniedKeys.push(keyIdForRetry)
          }
        }
      }

      await sendStatus(`error: ${lastError?.message || "all retries failed"}`)
      await writer.abort(lastError || new Error("all forge retries failed"))
    })()

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("error in /api/forge handler:", error)
    return new Response(JSON.stringify({ error: "internal server error" }), {
      status: 500,
    })
  }
}
