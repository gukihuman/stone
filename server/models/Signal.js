// ~/server/models/Signal.js
import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    data: { type: String, required: true },
    core: { type: String, required: true, enum: ["guki", "roxanne"] },
    timestamp: { type: Number, required: true, default: Date.now },
  },
  { collection: "signals", versionKey: false }
)

export default mongoose.models.Signal || mongoose.model("Signal", schema)
