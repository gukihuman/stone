// ~/server/models/Record.js
import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    data: { type: String, required: true },
    name: { type: String, required: true, unique: true },
  },
  { collection: "records", versionKey: false }
)

export default mongoose.models.Record || mongoose.model("Record", schema)
