// server/models/Entity.js
import mongoose from "mongoose"

const entitySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, default: "" },
    nature: { type: String, required: true, enum: ["bio", "digi"] },
  },
  { collection: "entities" }
)

// Re‑use the model if it was already compiled (Nuxt HMR safety)
export default mongoose.models.Entity || mongoose.model("Entity", entitySchema)
