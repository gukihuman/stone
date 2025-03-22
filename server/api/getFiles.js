import fs from "node:fs/promises" // Use promises version for async/await
import path from "node:path"

export default defineEventHandler(async (event) => {
  try {
    const { path: rootPath, ignore } = await readBody(event)

    // Validate inputs
    if (!rootPath || typeof rootPath !== "string") {
      throw new Error("Invalid 'path' parameter. Must be a non-empty string.")
    }
    if (!Array.isArray(ignore)) {
      throw new Error("Invalid 'ignore' parameter. Must be an array.")
    }

    const allowedExtensions = [".js", ".vue", ".css", ".ts", ".json", ".md"]

    const filesData = []

    async function walk(dir) {
      let files
      try {
        files = await fs.readdir(dir, { withFileTypes: true })
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err) //Log and skip
        return
      }

      for (const file of files) {
        const fullPath = path.join(dir, file.name)
        const relativePath = path.relative(rootPath, fullPath)

        // Check if the file or directory should be ignored
        if (ignore.includes(file.name)) continue

        if (file.isDirectory()) {
          await walk(fullPath) // Recurse into subdirectories
        } else if (
          file.isFile() &&
          allowedExtensions.includes(path.extname(file.name))
        ) {
          try {
            const fileContent = await fs.readFile(fullPath, "utf-8")
            filesData.push({ path: relativePath, content: fileContent })
          } catch (err) {
            console.error(`Error reading file ${fullPath}:`, err) //Log and skip
          }
        }
      }
    }

    await walk(rootPath)
    return filesData // Return the object directly, Nuxt handles JSON serialization
  } catch (error) {
    // Centralized error handling
    console.error("Error in /api/getFiles:", error)
    throw createError({
      statusCode: 400, // Or 500 depending on the error type
      statusMessage: error.message,
    })
  }
})
