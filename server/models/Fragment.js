// ~/server/models/Fragment.js
import mongoose from "mongoose"

const fragmentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    entity: { type: String, required: true },
    space: { type: [String], required: true, default: [] },
    data: { type: String, required: true },
    timestamp: { type: Number, required: true, default: Date.now },
    parent: { type: String, default: null },
  },
  { collection: "fragments", versionKey: false }
)

export default mongoose.models.Fragment ||
  mongoose.model("Fragment", fragmentSchema)
