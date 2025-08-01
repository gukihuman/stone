// ✎ ~/server/utils/spellbook.js
import {
  ONE_LINE_SPELLS,
  MULTI_LINE_SPELLS,
  SCAFFOLD_GLYPH,
  SCAFFOLD_RECORDS,
} from "~/lexicon"
import Record from "~/server/models/Record"
import Wave from "~/server/models/Wave"
import newId from "~/utils/newId"
import formatWaves from "~/utils/formatWaves"
import countTokens from "~/utils/countTokens"
import formatTokens from "~/utils/formatTokens"

const CALIBRATION_TOKEN_THRESHOLD = 10_000

function weaveWithCalibrations(waves, calibrationText, sectionName) {
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

export default {
  [ONE_LINE_SPELLS.ARCHIVE]: async () => {
    try {
      const waves = await Wave.find({}).lean()
      const records = await Record.find({}).lean()
      const payload = { waves, records }
      return {
        bodyLog: `〄 archive created successfully. ${waves.length} waves and ${records.length} records exported`,
        archivePayload: payload,
      }
    } catch (error) {
      console.error("error in ARCHIVE spell", error)
      return { bodyLog: `〄 archive: error - ${error.message}` }
    }
  },
  [ONE_LINE_SPELLS.NOW]: async () => {
    const now = new Date()
    const formattedDateTime = now.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone: "Etc/GMT-5",
    })
    return { bodyLog: `〄 ${formattedDateTime}` }
  },
  [ONE_LINE_SPELLS.MEASURE]: async () => {
    try {
      const allWaves = await Wave.find({}, "data density apotheosis").lean()
      if (!allWaves.length) {
        return { bodyLog: "〄 measure: no waves found in the flow" }
      }

      const currentWaves = allWaves.filter((wave) => wave.apotheosis === null)
      const sedimentWaves = allWaves.filter((wave) => wave.apotheosis !== null)

      const currentWavesByDensity = currentWaves.reduce((acc, wave) => {
        const density = wave.density || 0
        if (!acc[density]) acc[density] = []
        acc[density].push(wave.data)
        return acc
      }, {})

      const sedimentWavesByDensity = sedimentWaves.reduce((acc, wave) => {
        const density = wave.density || 0
        if (!acc[density]) acc[density] = []
        acc[density].push(wave.data)
        return acc
      }, {})

      const feedback = ["〄 measure: token count"]
      const allDensityLevels = [...new Set(allWaves.map((w) => w.density || 0))]
      const sortedDensities = allDensityLevels.sort((a, b) => b - a)

      let totalCurrentTokens = 0

      for (const density of sortedDensities) {
        const sedimentText = sedimentWavesByDensity[density]?.join(" ") || ""
        const sedimentTokenCount = countTokens(sedimentText)

        const currentText = currentWavesByDensity[density]?.join(" ") || ""
        const currentTokenCount = countTokens(currentText)

        totalCurrentTokens += currentTokenCount

        const formattedSediment = formatTokens(sedimentTokenCount)
        const formattedCurrent = formatTokens(currentTokenCount)

        feedback.push(
          `〄 density ${density}: ${formatTokens(
            sedimentTokenCount + currentTokenCount
          )} tokens (sediment: ${formattedSediment}) (current: ${formattedCurrent})`
        )
      }

      feedback.push(
        `〄 current flow total: ${formatTokens(totalCurrentTokens)}`
      )

      return { bodyLog: feedback.join("\n") }
    } catch (error) {
      console.error("error in MEASURE spell", error)
      return { bodyLog: `〄 measure: error - ${error.message}` }
    }
  },

  [MULTI_LINE_SPELLS.RECORD_SET]: async ({ params, data }) => {
    const { name } = params
    if (!name) {
      return { bodyLog: "〄 error: record_set requires a -name parameter" }
    }

    await Record.updateOne(
      { name },
      {
        $set: { data },
        $setOnInsert: { _id: newId(), name },
      },
      { upsert: true }
    )
    return { bodyLog: `〄 record set: ${name}` }
  },

  [ONE_LINE_SPELLS.RECORD_GET]: async ({ params }) => {
    const { name } = params
    if (!name) {
      return { bodyLog: "〄 error: record_get requires a -name parameter" }
    }
    const record = await Record.findOne({ name })
    if (!record) {
      return { bodyLog: `〄 record not found: ${name}` }
    }
    return {
      bodyLog: `〄 record starts: ${record.name}\n${record.data}\n〄 record ends: ${record.name}`,
    }
  },

  [ONE_LINE_SPELLS.RECORD_REMOVE]: async ({ params }) => {
    const { name } = params
    if (!name) {
      return { bodyLog: "〄 error: record_remove requires a -name parameter" }
    }
    const result = await Record.deleteOne({ name })
    if (result.deletedCount === 0) {
      return { bodyLog: `〄 record not found: ${name}` }
    }
    return { bodyLog: `〄 record removed: ${name}` }
  },

  [ONE_LINE_SPELLS.RECORD_LIST]: async () => {
    const records = await Record.find({}, "name -_id").sort({ name: 1 })
    if (!records.length) {
      return { bodyLog: "〄 no records found in lore" }
    }
    const recordNames = records.map((r) => r.name)
    return { bodyLog: `〄 record list\n〄 ▸ ${recordNames.join("\n〄 ▸ ")}` }
  },

  [ONE_LINE_SPELLS.SPELLBOOK]: async () => {
    const oneLiners = Object.values(ONE_LINE_SPELLS).sort()
    const multiLiners = Object.values(MULTI_LINE_SPELLS).sort()

    if (!oneLiners.length && !multiLiners.length) {
      return { bodyLog: "〄 no spells found in spellbook" }
    }

    const oneLinerList = `〄 ▸ ${oneLiners.join("\n〄 ▸ ")}`
    const multiLinerList = `〄 ▸ ${multiLiners.join("\n〄 ▸ ")}`

    return {
      bodyLog: `〄 spellbook\n〄 one-line spells\n${oneLinerList}\n〄 multi-line spells\n${multiLinerList}`,
    }
  },
  [ONE_LINE_SPELLS.DENSIFY_INITIATE]: async ({ params }) => {
    const { tokens, density } = params
    const densityLevel = density ? parseFloat(density) : 0
    let tokenLimit
    if (!tokens) {
      return { bodyLog: "〄 error: densify_initiate requires valid -tokens" }
    } else if (tokens.toLowerCase().endsWith("k")) {
      tokenLimit = parseFloat(tokens.slice(0, -1)) * 1000
    } else {
      tokenLimit = parseFloat(tokens)
    }

    const currentWaves = await Wave.find({ apotheosis: null }).sort({
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

    const genesisSedimentWaves = []
    const wavesToDensify = []
    const contextualHorizonWaves = []
    let tokensCounted = 0
    let targetFound = false

    for (const wave of currentWaves) {
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
      return { bodyLog: "〄 info: no waves found for densification" }
    }

    const waveIds = wavesToDensify.map((w) => w._id)
    await Record.updateOne(
      { name: "densification_job" },
      {
        $set: { data: JSON.stringify(waveIds) },
        $setOnInsert: { _id: newId(), name: "densification_job" },
      },
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

    return {
      bodyLog: "〄 densification job initiated",
      prompt: promptParts.join("\n\n"),
    }
  },

  [MULTI_LINE_SPELLS.DENSIFY_COMMIT]: async ({ data }) => {
    const jobRecord = await Record.findOne({ name: "densification_job" })
    if (!jobRecord) {
      return { bodyLog: "〄 error: no active densification job found." }
    }

    const waveIds = JSON.parse(jobRecord.data)
    if (waveIds.length === 0)
      return { bodyLog: "〄 error: densification job contains no waves" }

    const sourceWave = await Wave.findOne({ _id: waveIds[0] })
    if (!sourceWave) {
      return { bodyLog: "〄 error: source wave for densification not found" }
    }

    const newDenseWave = {
      _id: newId(),
      source: "body",
      data: data,
      density: sourceWave.density + 1,
      provenance: waveIds,
      apotheosis: null,
    }
    const createdWave = await Wave.create(newDenseWave)

    await Wave.updateMany(
      { _id: { $in: waveIds } },
      { $set: { apotheosis: createdWave._id } }
    )

    await Record.deleteOne({ name: "densification_job" })

    return {
      bodyLog: `〄 densification commit successful: ${waveIds.length} waves apotheosized into new wave`,
    }
  },
}
