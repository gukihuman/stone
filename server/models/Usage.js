//〔 ~/server/models/Usage.js

import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton_usage_document" },
    date: { type: String },
    googleProRequests: { type: Number, default: 0 },
    googleFlashRequests: { type: Number, default: 0 },
    googleFlashLiteRequests: { type: Number, default: 0 },
    googleFlashTtsRequests: { type: Number, default: 0 },
  },
  { collection: "usage", versionKey: false }
)

export default mongoose.models.Usage || mongoose.model("Usage", schema)
