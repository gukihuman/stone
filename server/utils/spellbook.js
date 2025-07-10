// ~/server/utils/spellbook.js
import { ONE_LINE_SPELLS, MULTI_LINE_SPELLS } from "~/shared/lexicon"
import Record from "~/server/models/Record"
import newId from "~/shared/utils/newId"

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
}
