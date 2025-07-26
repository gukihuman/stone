//✎ ~/server/models/Usage.js (v2.0 - The Timestamp Ledger)

import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    //✎ _id is env key, e.g., "GOOGLE_API_KEY_0"
    _id: { type: String, required: true },
    //✎ each model now has its own last-used timestamp.
    googlePro: { type: Date, default: () => new Date(0) },
    googleFlash: { type: Date, default: () => new Date(0) },
    googleFlashLite: { type: Date, default: () => new Date(0) },
    googleFlashTts: { type: Date, default: () => new Date(0) },
  },
  { collection: "usage", versionKey: false }
)

export default mongoose.models.Usage || mongoose.model("Usage", schema)
