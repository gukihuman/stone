// ~/server/models/Record.js
import mongoose from "mongoose"
import encrypt from "mongoose-encryption"

const schema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    data: { type: String, required: true },
    name: { type: String, required: true, unique: true },
  },
  { collection: "records", versionKey: false }
)

const secretProvider = () => process.env.ACCESS_TOKEN

if (process.env.ACCESS_TOKEN) {
  schema.plugin(encrypt, {
    secret: secretProvider,
    encryptedFields: ["data"],
  })
} else {
  console.warn(
    "[SECURITY WARNING] No ACCESS_TOKEN found for Record encryption."
  )
}

export default mongoose.models.Record || mongoose.model("Record", schema)
