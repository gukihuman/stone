// server/models/Entity.js
import mongoose from "mongoose"

const entitySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: {
      type: String,
      default: "",
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9-]+$/,
        "name can only contain alphanumeric characters and dashes",
      ],
    },
    nature: { type: String, required: true, enum: ["bio", "digi"] },
  },
  { collection: "entities" }
)

export default mongoose.models.Entity || mongoose.model("Entity", entitySchema)
