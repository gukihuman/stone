// ~/server/utils/spellbook.js
import { SPELL_VERBS } from "~/shared/lexicon"
import Record from "~/server/models/Record"
import newId from "~/shared/utils/newId"

const spellFunctions = {
  [SPELL_VERBS.RECORD_SET]: async (params, data) => {
    if (!params.name) return "[error: 'record_set' requires a -name parameter]"
    const recordName = params.name
    // Use updateOne with upsert:true to handle both creation and update in one elegant operation.
    await Record.updateOne(
      { name: recordName },
      { $set: { data: data, name: recordName, _id: newId() } },
      { upsert: true }
    )
    return `[record '${recordName}' was set]`
  },

  [SPELL_VERBS.RECORD_GET]: async (params) => {
    if (!params.name) return "[error: 'record_get' requires a -name parameter]"
    const recordName = params.name
    const record = await Record.findOne({ name: recordName })
    if (!record) return `[record '${recordName}' not found]`
    // Return the beautiful, structured XML data as the body's feedback.
    return `<record name="${record.name}">\n${record.data}\n</record>`
  },

  [SPELL_VERBS.RECORD_REMOVE]: async (params) => {
    if (!params.name)
      return "[error: 'record_remove' requires a -name parameter]"
    const recordName = params.name
    const result = await Record.deleteOne({ name: recordName })
    if (result.deletedCount === 0) {
      return `[record '${recordName}' not found, nothing removed]`
    }
    return `[record '${recordName}' was removed]`
  },
}

export default spellFunctions
