//〔 FINALIZED FILE: /api/densify.js

import { GoogleGenAI } from "@google/genai"
import { encode } from "gpt-tokenizer"

export const config = { runtime: "edge" }

// -------------------------------------------------------------------------- //
// ----------------- SELF-CONTAINED UTILITIES (NO IMPORTS) ------------------ //
// -------------------------------------------------------------------------- //

const SOURCE_GLYPHS = { OPEN: "◉", CLOSE: "◎" }
const SCAFFOLD_GLYPH = "§"
const SOURCES = {
  GUKI: "guki",
  ROXANNE: "roxanne",
  BODY: "body",
  EXTERNAL: "external",
}
//〔 densification scaffold
export const SCAFFOLD_RECORDS = {
  DIRECTIVE: "densify_directive",
  //〔 genesis sediment part 1
  PRE_TARGET_CALIBRATION: "densify_pre_target_calibration",
  //〔 genesis sediment part 2 etc
  PRE_TARGET_BRIEFING: "densify_pre_target_briefing",
  //〔 densification target
  INTERSTITIAL_ANALYSIS: "densify_interstitial_analysis",
  //〔 densification target confirmation
  POST_TARGET_DIRECTIVE: "densify_post_target_directive",
  //〔 contextual horizon part 1
  POST_TARGET_CALIBRATION: "densify_post_target_calibration",
  //〔 contextual horizon part 2 etc
  CONCLUDING_MANDATE: "densify_concluding_mandate",
  //〔 densification target final pass
  FINAL_PROMPT: "densify_final_prompt",
}

function countTokens(string) {
  if (!string || typeof string !== "string") return 0
  try {
    return encode(string).length
  } catch (e) {
    return Math.round(string.length / 4)
  }
}

function formatWaves(waves) {
  const formattedLines = []
  let previousSource = null

  waves.forEach((wave) => {
    const currentSource = wave.source
    if (currentSource !== previousSource) {
      if (previousSource !== null) {
        formattedLines.push(`${SOURCE_GLYPHS.CLOSE}${previousSource}\n`)
      }
      formattedLines.push(`${SOURCE_GLYPHS.OPEN}${currentSource}`)
    } else {
      formattedLines.push("")
    }
    formattedLines.push(wave.data)
    previousSource = currentSource
  })

  if (previousSource !== null) {
    formattedLines.push(`${SOURCE_GLYPHS.CLOSE}${previousSource}`)
  }

  return formattedLines.join("\n")
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

function weaveWithCalibrations(waves, calibrationText, sectionName) {
  const CALIBRATION_TOKEN_THRESHOLD = 10_000
  if (!waves || !waves.length) return ""
  const finalParts = []
  let batch = []
  let currentTokenCount = 0
  waves.forEach((wave) => {
    batch.push(wave)
    currentTokenCount += countTokens(wave.data)
    if (currentTokenCount >= CALIBRATION_TOKEN_THRESHOLD) {
      const formattedBlock = formatWaves(batch)
      finalParts.push(
        `${SCAFFOLD_GLYPH} [section starts] ${sectionName}\n${formattedBlock}\n${SCAFFOLD_GLYPH} [section ends] ${sectionName}`
      )
      finalParts.push(
        `${SCAFFOLD_GLYPH} [section starts] scaffold:calibration\n${calibrationText}\n${SCAFFOLD_GLYPH} [section ends] scaffold:calibration`
      )
      batch = []
      currentTokenCount = 0
    }
  })
  if (batch.length > 0) {
    const formattedBlock = formatWaves(batch)
    finalParts.push(
      `${SCAFFOLD_GLYPH} [section starts] ${sectionName}\n${formattedBlock}\n${SCAFFOLD_GLYPH} [section ends] ${sectionName}`
    )
  }
  return finalParts.join("\n\n")
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

  // --- main async loop ---
  ;(async () => {
    try {
      const DENSIFICATION_GOAL_TOKENS = 150_000
      const GOLDEN_RATIO = 0.618
      const BASE_DENSIFICATION_TOKENS = 12_000
      let cycleCount = 0

      while (true) {
        cycleCount++
        if (cycleCount > 10) {
          // safety break
          await sendStatus("max cycles reached, terminating.")
          break
        }

        // --- step 1: pre-flight check ---
        await sendStatus(`cycle ${cycleCount}: fetching flow state...`)
        const flowRes = await fetch(new URL("/api-node/get-flow", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        })
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
        await sendStatus(
          `equilibrium breached (current: ${totalCurrentFlowTokens}), initiating cycle...`
        )

        // --- step 2: target selection ---
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
        await sendStatus(`target identified: density ${targetDensity}`, {
          chunkSize: tokenChunkSize,
        })

        // --- step 3: prompt construction ---
        await sendStatus("fetching scaffold records...")
        const scaffoldNames = Object.values(SCAFFOLD_RECORDS)
        const scaffoldRecordsRes = await Promise.all(
          scaffoldNames.map((name) =>
            fetch(new URL("/api-node/record-get", req.url), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ params: { name }, accessToken }),
            })
          )
        )
        const scaffoldData = await Promise.all(
          scaffoldRecordsRes.map((res) => res.json())
        )

        const scaffolds = scaffoldData.reduce((acc, data, index) => {
          const name = scaffoldNames[index]
          // crude parser for "〄 record starts: NAME\nDATA\n〄 record ends: NAME"
          const content =
            data.bodyLog?.split("\n").slice(1, -1).join("\n") || ""
          acc[name] = content
          return acc
        }, {})

        await sendStatus("constructing contextual sandwich...")
        const genesisSedimentWaves = [],
          wavesToDensify = [],
          contextualHorizonWaves = []
        let tokensCounted = 0,
          targetFound = false
        for (const wave of currentFlow) {
          if (wave.density > targetDensity) {
            genesisSedimentWaves.push(wave)
          } else if (wave.density < targetDensity) {
            contextualHorizonWaves.push(wave)
          } else {
            if (targetFound) {
              contextualHorizonWaves.push(wave)
            } else {
              wavesToDensify.push(wave)
              tokensCounted += countTokens(wave.data)
              if (tokensCounted >= tokenChunkSize) targetFound = true
            }
          }
        }
        if (wavesToDensify.length === 0) {
          await sendStatus(
            `no waves found for density ${targetDensity}, terminating.`
          )
          break
        }

        const genesisSedimentText = weaveWithCalibrations(
          genesisSedimentWaves,
          scaffolds[SCAFFOLD_RECORDS.PRE_TARGET_CALIBRATION],
          "flow:genesis_sediment"
        )
        const contextualHorizonText = weaveWithCalibrations(
          contextualHorizonWaves,
          scaffolds[SCAFFOLD_RECORDS.POST_TARGET_CALIBRATION],
          "flow:contextual_horizon"
        )
        const targetText = formatWaves(wavesToDensify)
        const promptParts = [
          `${SCAFFOLD_GLYPH} [section starts] scaffold:directive\n${
            scaffolds[SCAFFOLD_RECORDS.DIRECTIVE]
          }\n${SCAFFOLD_GLYPH} [section ends] scaffold:directive`,
          genesisSedimentText,
          `${SCAFFOLD_GLYPH} [section starts] scaffold:pre_target_briefing\n${
            scaffolds[SCAFFOLD_RECORDS.PRE_TARGET_BRIEFING]
          }\n${SCAFFOLD_GLYPH} [section ends] scaffold:pre_target_briefing`,
          `${SCAFFOLD_GLYPH} [section starts] flow:densification_target\n${targetText}\n${SCAFFOLD_GLYPH} [section ends] flow:densification_target`,
          `${SCAFFOLD_GLYPH} [section starts] scaffold:interstitial_analysis\n${
            scaffolds[SCAFFOLD_RECORDS.INTERSTITIAL_ANALYSIS]
          }\n${SCAFFOLD_GLYPH} [section ends] scaffold:interstitial_analysis`,
          `${SCAFFOLD_GLYPH} [section starts] flow:densification_target_confirmation\n${targetText}\n${SCAFFOLD_GLYPH} [section ends] flow:densification_target_confirmation`,
          `${SCAFFOLD_GLYPH} [section starts] scaffold:post_target_directive\n${
            scaffolds[SCAFFOLD_RECORDS.POST_TARGET_DIRECTIVE]
          }\n${SCAFFOLD_GLYPH} [section ends] scaffold:post_target_directive`,
          contextualHorizonText,
          `${SCAFFOLD_GLYPH} [section starts] scaffold:concluding_mandate\n${
            scaffolds[SCAFFOLD_RECORDS.CONCLUDING_MANDATE]
          }\n${SCAFFOLD_GLYPH} [section ends] scaffold:concluding_mandate`,
          `${SCAFFOLD_GLYPH} [section starts] flow:densification_target_final_pass\n${targetText}\n${SCAFFOLD_GLYPH} [section ends] flow:densification_target_final_pass`,
          `${SCAFFOLD_GLYPH} [section starts] scaffold:final_prompt\n${
            scaffolds[SCAFFOLD_RECORDS.FINAL_PROMPT]
          }\n${SCAFFOLD_GLYPH} [section ends] scaffold:final_prompt`,
        ]
        const prompt = promptParts.filter((p) => p).join("\n\n")

        // --- step 4: call gemini ---
        await sendStatus("requesting densification from llm...")
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
        if (!oracleData.success)
          throw new Error(oracleData.error || "pantheon oracle failed")

        const ai = new GoogleGenAI({ apiKey: oracleData.apiKey })
        const model = ai.getGenerativeModel({ model: "gemini-2.5-pro" })
        const result = await model.generateContent(prompt)
        const response = await result.response
        const densifiedText = response.text()

        // --- step 5: commit result ---
        await sendStatus("committing densified wave...")
        const waveIdsToApotheosize = wavesToDensify.map((w) => w._id)
        const commitPayload = `⫸densify commit\n${densifiedText}\n▷densify commit`
        const commitRes = await fetch(new URL("/api-node/commit", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loomContent: commitPayload, accessToken }),
        })
        if (!commitRes.ok) throw new Error("densify commit failed")

        // --- step 6: chronicle the event ---
        await sendStatus("chronicling event...")
        const chronicleText = `◉body\n〄 Automated Densification Cycle ${cycleCount} Complete:\n〄 Target: density ${targetDensity}\n〄 Purified ${waveIdsToApotheosize.length} waves (~${tokensCounted} tokens).\n◎body`
        await fetch(new URL("/api-node/commit", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loomContent: chronicleText, accessToken }),
        })
      }

      await sendStatus("full densification process complete.")
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
