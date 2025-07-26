//〔 FINALIZED FILE: ~/api/densify.js (v3.3 - The Self-Healing Temple)

import { GoogleGenAI } from "@google/genai"
import { encode } from "gpt-tokenizer"

export const config = { runtime: "edge" }

// -------------------------------------------------------------------------- //
// ----------------- SELF-CONTAINED UTILITIES (NO IMPORTS) ------------------ //
// -------------------------------------------------------------------------- //

const SOURCES = { BODY: "body" }
const MULTI_LINE_SPELLS = { DENSIFY_COMMIT: "densify commit" }

function countTokens(string) {
  if (!string || typeof string !== "string") return 0
  try {
    return encode(string).length
  } catch (e) {
    return Math.round(string.length / 4)
  }
}

function calculateGoldenPartition(totalTokens, layerCount) {
  const GOLDEN_RATIO_PHI = 1.618034
  if (layerCount <= 0 || totalTokens <= 0) return {}
  if (layerCount === 1) return { 0: totalTokens }
  const proportionalSum =
    (Math.pow(GOLDEN_RATIO_PHI, layerCount) - 1) / (GOLDEN_RATIO_PHI - 1)
  if (proportionalSum === 0) return {}
  const baseUnit = totalTokens / proportionalSum
  const distribution = {}
  for (let i = 0; i < layerCount; i++) {
    const density = i
    const power = layerCount - 1 - density
    distribution[density] = Math.round(
      baseUnit * Math.pow(GOLDEN_RATIO_PHI, power)
    )
  }
  return distribution
}

// -------------------------------------------------------------------------- //
// --------------------------- MAIN EDGE HANDLER ---------------------------- //
// -------------------------------------------------------------------------- //

export default async function handler(req) {
  // --- boilerplate: cors, auth, stream setup ---
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
  const { accessToken } = await req.json()
  const secret = process.env.ACCESS_TOKEN
  if (!secret || !accessToken || accessToken !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 403,
    })
  }

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()
  const sendStatus = async (status, data = {}) => {
    try {
      await writer.ready
      await writer.write(enc.encode(JSON.stringify({ status, ...data }) + "\n"))
    } catch (e) {
      console.warn("[Densify Status Send Error]:", e.message)
    }
  }

  // --- main async function ---
  ;(async () => {
    try {
      const DENSIFICATION_GOAL_TOKENS = 100_000
      const GOLDEN_RATIO = 0.618
      const BASE_DENSIFICATION_TOKENS = 12_000
      let cycleCount = 0

      while (true) {
        cycleCount++
        if (cycleCount > 3) {
          await sendStatus("max cycles reached")
          break
        }

        await sendStatus(`cycle ${cycleCount}: fetching flow state...`)
        const flowRes = await fetch(new URL("/api-node/get-flow", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        })
        if (!flowRes.ok) throw new Error("failed to fetch flow state")
        const { waves: currentFlow } = await flowRes.json()

        const totalCurrentFlowTokens = currentFlow.reduce(
          (sum, wave) => sum + countTokens(wave.data),
          0
        )
        if (totalCurrentFlowTokens <= DENSIFICATION_GOAL_TOKENS) {
          await sendStatus("equilibrium reached", {
            tokenCount: totalCurrentFlowTokens,
          })
          break
        }
        await sendStatus(`${totalCurrentFlowTokens} preparing...`)

        const actualDistribution = currentFlow.reduce((acc, wave) => {
          const density = wave.density || 0
          acc[density] = (acc[density] || 0) + countTokens(wave.data)
          return acc
        }, {})
        const layerCount = Object.keys(actualDistribution).length
        const idealDistribution = calculateGoldenPartition(
          totalCurrentFlowTokens,
          layerCount
        )

        const candidatePool = Object.keys(actualDistribution)
          .map((d) => parseInt(d))
          .filter((d) => actualDistribution[d] > idealDistribution[d])
        if (candidatePool.length === 0) {
          await sendStatus("no over-represented layers found, terminating.")
          break
        }
        const targetDensity = candidatePool.reduce(
          (maxDeviant, d) =>
            actualDistribution[d] / idealDistribution[d] >
            actualDistribution[maxDeviant] / idealDistribution[maxDeviant]
              ? d
              : maxDeviant,
          candidatePool[0]
        )
        const tokenChunkSize = Math.round(
          BASE_DENSIFICATION_TOKENS * Math.pow(GOLDEN_RATIO, targetDensity)
        )

        const spellToCast = `⫸densify initiate -density ${targetDensity} -tokens ${tokenChunkSize}`
        const bodyWaveContent = `◉${SOURCES.BODY}\n${spellToCast}\n◎${SOURCES.BODY}`

        const initiateCommitRes = await fetch(
          new URL("/api-node/commit", req.url),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ loomContent: bodyWaveContent, accessToken }),
          }
        )
        if (!initiateCommitRes.ok)
          throw new Error("server-to-server spell commit failed")
        const { prompt } = await initiateCommitRes.json()
        if (!prompt)
          throw new Error("densify initiate spell did not return a prompt")
        console.log("prompt size: ", countTokens(prompt))

        // --- self-healing llm call ---
        let densifiedText = ""
        const MAX_RETRIES = 5
        const deniedKeys = []
        let lastError = null
        let llmSuccess = false
        for (let i = 0; i < MAX_RETRIES; i++) {
          let keyIdForRetry
          try {
            await sendStatus(`retrying llm ${i}...`)
            // await sendStatus(
            //   i === 0 ? "densify llm thinking..." : `retrying llm (${i})...`
            // )
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
            })
            let bufferedText = ""
            for await (const chunk of responseStream) {
              if (bufferedText === "") await sendStatus("densify llm typing...")
              bufferedText += chunk.text
            }
            if (bufferedText.trim() === "")
              throw new Error("generation returned empty response")
            densifiedText = bufferedText
            llmSuccess = true
            break
          } catch (e) {
            console.error(
              `densify attempt ${i + 1} with key ${keyIdForRetry} failed:`,
              e.message
            )
            lastError = e
            if (keyIdForRetry) deniedKeys.push(keyIdForRetry)
          }
        }
        if (!llmSuccess)
          throw lastError || new Error("all densify retries failed")

        // --- final commit ---
        let lines = densifiedText.trim().split("\n")
        const expectedStart = `⫸${MULTI_LINE_SPELLS.DENSIFY_COMMIT}`
        const expectedEnd = `▷${MULTI_LINE_SPELLS.DENSIFY_COMMIT}`
        if (!lines[0]?.trim().startsWith(expectedStart))
          lines.unshift(expectedStart)
        if (!lines[lines.length - 1]?.trim().startsWith(expectedEnd))
          lines.push(expectedEnd)
        const commitPayload = lines.join("\n")

        const finalCommitRes = await fetch(
          new URL("/api-node/commit", req.url),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ loomContent: commitPayload, accessToken }),
          }
        )
        if (!finalCommitRes.ok) throw new Error("final densify commit failed")

        await sendStatus(`cycle ${cycleCount} complete.`)
        // await sendStatus("waiting for rate limits...")
        // await new Promise((resolve) => setTimeout(resolve, 40_000))
      }

      await sendStatus("densification process complete")
      await writer.close()
    } catch (e) {
      console.error("[Densify Main Loop Error]:", e)
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
}
