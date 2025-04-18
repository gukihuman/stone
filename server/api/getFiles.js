import fs from "node:fs/promises"
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
        console.error(`Error reading directory ${dir}:`, err)
        return
      }

      // Sort entries: directories first, then files, both alphabetically
      files.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1 // Directories before files
        if (!a.isDirectory() && b.isDirectory()) return 1 // Files after directories
        return a.name.localeCompare(b.name) // Alphabetical within each group
      })

      for (const file of files) {
        const fullPath = path.join(dir, file.name)
        const relativePath = path.relative(rootPath, fullPath)

        if (ignore.includes(file.name)) continue

        if (file.isDirectory()) {
          await walk(fullPath) // Recurse into subdirectories first
        } else if (
          file.isFile() &&
          allowedExtensions.includes(path.extname(file.name))
        ) {
          try {
            const fileContent = await fs.readFile(fullPath, "utf-8")
            const normalizedContent = fileContent.replace(/\r\n/g, "\n")
            filesData.push({ path: relativePath, content: normalizedContent })
          } catch (err) {
            console.error(`Error reading file ${fullPath}:`, err)
          }
        }
      }
    }

    await walk(rootPath)
    return filesData
  } catch (error) {
    console.error("Error in /api/getFiles:", error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    })
  }
})
