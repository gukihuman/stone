// ~/server/utils/dbConnect.js
import mongoose from "mongoose"

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env"
  )
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) cached = global.mongoose = { conn: null, promise: null }

async function dbConnect() {
  if (cached.conn) {
    console.log("🚀 Using cached MongoDB connection")
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable buffering if connection goes down
      dbName: "StoneDB", // Explicitly set DB name
    }

    console.log(" Mongoose connectionString:", MONGO_URI)

    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((mongoose) => {
        console.log("✅ New MongoDB connection established")
        return mongoose
      })
      .catch((error) => {
        console.error(" MongoDB connection error:", error)
        // Making sure promise is null on error allows retry
        cached.promise = null
        throw error // Rethrow error to be handled by caller
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    // If connection fails, the promise is already nullified
    // Rethrow error to be handled by the API route or server startup
    throw error
  }
  return cached.conn
}

export default dbConnect
