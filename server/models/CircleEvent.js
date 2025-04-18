import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
  {
    entityId: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
)
const memoryRecordSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    tags: { type: [String], default: [] },
    tokens: { type: Number },
    id: { type: String, required: true },
  },
  { _id: false }
)
const circleEventSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  participantIds: { type: [String], required: true, default: [] },
  content: { type: [messageSchema], default: [] },
  // object where keys are entity ids, values are arrays of memory records
  memory: { type: Map, of: [memoryRecordSchema], default: {} },
})
// Avoid redefining the model if it already exists (important for Nuxt HMR)
export default mongoose.models.CircleEvent ||
  mongoose.model("CircleEvent", circleEventSchema)
