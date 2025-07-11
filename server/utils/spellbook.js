// ~/server/utils/spellbook.js
import {
  ONE_LINE_SPELLS,
  MULTI_LINE_SPELLS,
  SCAFFOLD_GLYPH,
  SCAFFOLD_RECORDS,
} from "~/shared/lexicon"
import Record from "~/server/models/Record"
import Wave from "~/server/models/Wave"
import newId from "~/shared/utils/newId"
import countTokens from "~/shared/utils/countTokens"
// import formatFragments from "~/shared/utils/formatFragments"

import { SOURCE_GLYPHS } from "~/shared/lexicon"

function formatFragments(waves) {
  if (!waves || !waves.length) return ""

  const formattedLines = []
  let previousSource = null

  waves.forEach((wave) => {
    const currentSource = wave.source
    if (currentSource !== previousSource) {
      if (previousSource !== null) {
        formattedLines.push(`${SOURCE_GLYPHS.CLOSE}${previousSource}\n`)
      }
      formattedLines.push(`${SOURCE_GLYPHS.OPEN}${currentSource}`)
    }
    formattedLines.push(wave.data)
    previousSource = currentSource
  })

  if (previousSource !== null) {
    formattedLines.push(`${SOURCE_GLYPHS.CLOSE}${previousSource}`)
  }

  return formattedLines.join("\n")
}

const CALIBRATION_TOKEN_THRESHOLD = 1000

function weaveWithCalibrations(waves, calibrationText, sectionName) {
  if (!waves || !waves.length) return ""

  const finalParts = []
  let batch = []
  let currentTokenCount = 0

  waves.forEach((wave) => {
    batch.push(wave)
    currentTokenCount += countTokens(wave.data)

    if (currentTokenCount >= CALIBRATION_TOKEN_THRESHOLD) {
      // Threshold breached, process the batch.
      const formattedBlock = formatFragments(batch)
      finalParts.push(
        `${SCAFFOLD_GLYPH} [section starts] ${sectionName}\n${formattedBlock}\n${SCAFFOLD_GLYPH} [section ends] ${sectionName}`
      )
      finalParts.push(
        `${SCAFFOLD_GLYPH} [section starts] scaffold:calibration\n${calibrationText}\n${SCAFFOLD_GLYPH} [section ends] scaffold:calibration`
      )

      // Reset for the next batch.
      batch = []
      currentTokenCount = 0
    }
  })

  // Process any remaining waves in the last batch.
  if (batch.length > 0) {
    const formattedBlock = formatFragments(batch)
    finalParts.push(
      `${SCAFFOLD_GLYPH} [section starts] ${sectionName}\n${formattedBlock}\n${SCAFFOLD_GLYPH} [section ends] ${sectionName}`
    )
  }

  return finalParts.join("\n\n")
}

export default {
  [MULTI_LINE_SPELLS.RECORD_SET]: async (params, data) => {
    if (!params.name) return "[error: 'record_set' requires a -name parameter]"
    const recordName = params.name

    await Record.updateOne(
      { name: recordName },
      {
        $set: { data: data },
        $setOnInsert: { _id: newId(), name: recordName },
      },
      { upsert: true }
    )
    return `[record '${recordName}' was set]`
  },

  [ONE_LINE_SPELLS.RECORD_GET]: async (params) => {
    if (!params.name) return "[error: 'record_get' requires a -name parameter]"
    const recordName = params.name
    const record = await Record.findOne({ name: recordName })
    if (!record) return `[record '${recordName}' not found]`
    // Return the beautiful, structured XML data as the body's feedback.
    return `<record name="${record.name}">\n${record.data}\n</record>`
  },

  [ONE_LINE_SPELLS.RECORD_REMOVE]: async (params) => {
    if (!params.name)
      return "[error: 'record_remove' requires a -name parameter]"
    const recordName = params.name
    const result = await Record.deleteOne({ name: recordName })
    if (result.deletedCount === 0) {
      return `[record '${recordName}' not found, nothing removed]`
    }
    return `[record '${recordName}' was removed]`
  },

  [ONE_LINE_SPELLS.DENSIFY_INITIATE]: async (params) => {
    const { tokens, density } = params
    const tokenLimit = Number(tokens)
    const densityLevel = density ? Number(density) : 0

    if (isNaN(tokenLimit)) {
      return "[error: densify_initiate requires valid -tokens]"
    }

    // --- Data Fetching Logic remains the same, it is perfect ---
    const livingWaves = await Wave.find({ apotheosis: null }).sort({
      density: -1,
      timestamp: 1,
    })
    const scaffoldRecords = await Record.find({
      name: { $in: Object.values(SCAFFOLD_RECORDS) },
    })
    const scaffolds = scaffoldRecords.reduce((acc, rec) => {
      acc[rec.name] = rec.data
      return acc
    }, {})
    // --- Partitioning Logic remains the same, it is perfect ---
    const genesisSedimentWaves = []
    const wavesToDensify = []
    const contextualHorizonWaves = []
    let tokensCounted = 0
    let targetFound = false
    for (const wave of livingWaves) {
      if (wave.density > densityLevel) {
        genesisSedimentWaves.push(wave)
      } else if (wave.density === densityLevel) {
        if (targetFound) {
          contextualHorizonWaves.push(wave)
        } else {
          if (tokensCounted <= tokenLimit) {
            tokensCounted += countTokens(wave.data)
            wavesToDensify.push(wave)
          } else {
            targetFound = true
            contextualHorizonWaves.push(wave)
          }
        }
      } else {
        contextualHorizonWaves.push(wave)
      }
    }
    if (wavesToDensify.length === 0) {
      return "[info: no waves found for densification]"
    }
    const waveIds = wavesToDensify.map((w) => w._id)
    await Record.updateOne(
      { name: "densification_job" },
      { $set: { data: JSON.stringify(waveIds) } },
      { upsert: true }
    )
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
    const targetText = formatFragments(wavesToDensify)

    // --- The New, Perfected Prompt Assembly ---
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

    const fullPrompt = promptParts.join("\n\n")

    return { isPrompt: true, content: fullPrompt }
  },

  [MULTI_LINE_SPELLS.DENSIFY_COMMIT]: async (_, data) => {
    // 1. Pre-flight check for the job record
    const jobRecord = await Record.findOne({ name: "densification_job" })
    if (!jobRecord) {
      return "[error: no active densification job found. please initiate one first.]"
    }

    // 2. Prepare the new densified wave
    const waveIds = JSON.parse(jobRecord.data)
    if (waveIds.length === 0)
      return "[error: densification job contains no waves]"

    const sourceWave = await Wave.findOne({ _id: waveIds[0] })
    if (!sourceWave) return "[error: source wave for densification not found]"

    const newDenseWave = {
      _id: newId(),
      timestamp: Date.now(),
      source: "body",
      data: data,
      density: sourceWave.density + 1,
      provenance: waveIds,
      apotheosis: null,
    }
    const createdWave = await Wave.create(newDenseWave)

    // 3. Update the original waves
    await Wave.updateMany(
      { _id: { $in: waveIds } },
      { $set: { apotheosis: createdWave._id } }
    )

    // 4. Clean up the job record
    await Record.deleteOne({ name: "densification_job" })

    return `[densification commit successful: ${waveIds.length} waves apotheosized into new wave ${createdWave._id}]`
  },
}
