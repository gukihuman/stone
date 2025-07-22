//〔 ~/server/models/Usage.js

import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    //〔 _id is env key, e.g., "GOOGLE_API_KEY_0"
    _id: { type: String, required: true },
    //〔 last date usage was recorded for this key, in YYYY-MM-DD format
    date: { type: String, required: true },
    googleProRequests: { type: Number, default: 0 },
    googleFlashRequests: { type: Number, default: 0 },
    googleFlashLiteRequests: { type: Number, default: 0 },
    googleFlashTtsRequests: { type: Number, default: 0 },
  },
  { collection: "usage", versionKey: false }
)

export default mongoose.models.Usage || mongoose.model("Usage", schema)
