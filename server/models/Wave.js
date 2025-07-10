// ~/server/models/Wave.js
import mongoose from "mongoose"
import encrypt from "mongoose-encryption"

const schema = new mongoose.Schema(
  {
    data: { type: String, required: true },
    _id: { type: String, required: true },
    timestamp: { type: Number, required: true, default: Date.now },
    source: { type: String, required: true },
    density: { type: Number, default: 0 },
    provenance: { type: [String], default: [] },
    apotheosis: { type: String, default: null },
  },
  { collection: "waves", versionKey: false }
)

const secretProvider = () => process.env.ACCESS_TOKEN

if (process.env.ACCESS_TOKEN) {
  schema.plugin(encrypt, {
    secret: secretProvider,
    encryptedFields: ["data"],
  })
} else {
  console.warn("[SECURITY WARNING] No ACCESS_TOKEN found for Wave encryption.")
}

export default mongoose.models.Wave || mongoose.model("Wave", schema)
