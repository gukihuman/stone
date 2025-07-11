// ~/server/utils/spellbook.js
import {
  ONE_LINE_SPELLS,
  MULTI_LINE_SPELLS,
  SCAFFOLD_GLYPH,
} from "~/shared/lexicon"
import Record from "~/server/models/Record"
import Wave from "~/server/models/Wave"
import newId from "~/shared/utils/newId"
import countTokens from "~/shared/utils/countTokens"

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
    const densityLevel = Number(density)

    if (isNaN(tokenLimit) || isNaN(densityLevel)) {
      return "[error: densify_initiate requires valid -tokens and -density parameters]"
    }

    // 1. Fetch target waves
    const targetWaves = await Wave.find({
      density: densityLevel,
      apotheosis: null,
    }).sort({ timestamp: 1 }) // oldest first

    let tokensCounted = 0
    const wavesToDensify = []
    for (const wave of targetWaves) {
      const waveTokens = countTokens(wave.data)
      if (tokensCounted + waveTokens > tokenLimit) break
      tokensCounted += waveTokens
      wavesToDensify.push(wave)
    }

    if (wavesToDensify.length === 0) {
      return "[info: no waves found for densification at the specified density level]"
    }

    // 2. Create the job record
    const waveIds = wavesToDensify.map((w) => w._id)
    await Record.updateOne(
      { name: "densification_job" },
      { $set: { data: JSON.stringify(waveIds) } },
      { upsert: true }
    )

    // 3. Construct the prompt (this is a simplified sketch for now)
    const directiveRecord = await Record.findOne({ name: "densify_directive" })
    const directive = directiveRecord
      ? directiveRecord.data
      : "[ERROR: Missing densify_directive record]"
    const targetText = wavesToDensify.map((w) => w.data).join("\n")

    // NOTE: This is a placeholder for the full "Contextual Sandwich" assembly.
    // In the real version, we will fetch all scaffolds, genesis_sediment, etc.
    const fullPrompt = `${SCAFFOLD_GLYPH}scaffold:directive\n${directive}\n\n${SCAFFOLD_GLYPH}flow:densification_target\n${targetText}\n\n...etc...`

    // 4. Return the special prompt object
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
