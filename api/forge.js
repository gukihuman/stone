import { GoogleGenAI } from "@google/genai"

const SOURCE_GLYPHS = {
  OPEN: "◉",
  CLOSE: "◎",
}

const SOURCES = {
  GUKI: "guki",
  ROXANNE: "roxanne",
  BODY: "body",
  EXTERNAL: "external",
}

function wrapWithGlyphs(content, defaultSource) {
  if (!content.trim()) return ""
  let lines = content.trim().split("\n")

  // step 1: prepend opening glyph if missing.
  if (!lines[0]?.startsWith(SOURCE_GLYPHS.OPEN)) {
    lines.unshift(`${SOURCE_GLYPHS.OPEN}${defaultSource}`)
  }

  // step 2: append closing glyph if missing.
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

    if (!secret || !accessToken || accessToken !== secret) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      })
    }
    if (!prompt) {
      return new Response(JSON.stringify({ error: "no prompt provided" }), {
        status: 400,
      })
    }

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
      try {
        // step 1: get a key from our node oracle.
        await sendStatus("authenticating with pantheon...")
        const oracleRes = await fetch(
          new URL("/api-node/get-available-google-key", req.url),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modelKey: "googleProRequests",
              accessToken,
            }),
          }
        )
        const oracleData = await oracleRes.json()
        if (!oracleData.success) {
          throw new Error(oracleData.error || "pantheon oracle failed")
        }

        // step 2: generate the content.
        await sendStatus("forging new thought...")
        const ai = new GoogleGenAI({ apiKey: oracleData.apiKey })
        const model = "gemini-2.5-pro"
        const responseStream = await ai.models.generateContentStream({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { stopSequences: [`◎${SOURCES.ROXANNE}`] },
        })

        // step 3: buffer the entire response stream.
        let generatedText = ""
        for await (const chunk of responseStream) {
          // send a heartbeat status for the first chunk to show progress.
          if (generatedText === "") await sendStatus("receiving first token...")
          generatedText += chunk.text
        }
        if (generatedText.trim() === "")
          throw new Error("generation returned empty response")

        // step 4: wrap the text and commit it server-to-server.
        await sendStatus("committing to flow...")
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

        // step 5: signal completion.
        await sendStatus("complete")
        await writer.close()
      } catch (e) {
        console.error("[Forge Main Loop Error]:", e)
        await sendStatus(`error: ${e.message}`)
        await writer.abort(e)
      }
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
