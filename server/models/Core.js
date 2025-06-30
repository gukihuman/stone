// ~/server/models/Core.js
import mongoose from "mongoose"

const processSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9-]+$/,
        "name can only contain alphanumeric characters and dashes",
      ],
    },
    nature: { type: String, required: true, enum: ["bio", "digi"] },
  },
  { collection: "processes", versionKey: false }
)

export default mongoose.models.Process ||
  mongoose.model("Process", processSchema)
