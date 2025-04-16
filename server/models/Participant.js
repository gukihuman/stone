import mongoose from "mongoose"

const participantSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, default: "" },
  role: { type: String, required: true, enum: ["biological", "digital"] },
})
// Avoid redefining the model if it already exists (important for Nuxt HMR)
export default mongoose.models.Participant ||
  mongoose.model("Participant", participantSchema)
