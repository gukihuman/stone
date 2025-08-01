// ~/server/models/Wave.js
import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    data: { type: String, required: true },
    _id: { type: String, required: true },
    timestamp: { type: Number, required: true, default: Date.now },
    source: { type: String, required: true },
    density: { type: Number, default: 0 },
    // points to the ID(s) of the wave(s) this wave was created from
    provenance: { type: [String], default: [] },
    // points to the ID of the new, denser wave this wave became
    apotheosis: { type: String, default: null },
  },
  { collection: "waves", versionKey: false }
)

export default mongoose.models.Wave || mongoose.model("Wave", schema)
