// ~/server/models/Wave.js
import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    data: { type: String, required: true },
    core: { type: String, required: true, enum: ["guki", "roxanne"] },
    timestamp: { type: Number, required: true, default: Date.now },
    priority: { type: Number, default: 5, min: 0 },
    density: { type: Number, default: 0 },
    // points to the ID of the new, denser wave this wave became
    apotheosis: { type: String, default: null },
    // points to the ID(s) of the wave(s) this wave was created from
    provenance: { type: [String], default: [] },
  },
  { collection: "waves", versionKey: false }
)

export default mongoose.models.Wave || mongoose.model("Wave", schema)
