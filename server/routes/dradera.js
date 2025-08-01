// ☷ ~/server/api/dradera.js

import fs from "node:fs/promises"
import path from "node:path"

const allowedExtensions = [".js", ".vue", ".css", ".ts", ".json", ".ico"]
const projectRoot = process.cwd()

async function walk(dir, rootPath, ignore) {
  const filesData = []
  let files
  try {
    files = await fs.readdir(dir, { withFileTypes: true })
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err)
    return []
  }

  files.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1
    if (!a.isDirectory() && b.isDirectory()) return 1
    return a.name.localeCompare(b.name)
  })

  for (const file of files) {
    if (ignore.includes(file.name)) continue
    const fullPath = path.join(dir, file.name)
    if (file.isDirectory()) {
      filesData.push(...(await walk(fullPath, rootPath, ignore)))
    } else if (
      file.isFile() &&
      allowedExtensions.includes(path.extname(file.name))
    ) {
      filesData.push(path.relative(rootPath, fullPath))
    }
  }
  return filesData
}

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV !== "development") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden in this environment.",
    })
  }

  try {
    const bodyString = await readBody(event)
    const { command, payload } = JSON.parse(bodyString)

    if (command === "catalog") {
      const { ignore } = payload
      const filePaths = await walk(projectRoot, projectRoot, ignore)
      return { success: true, data: filePaths }
    }

    if (command === "get_scripture") {
      const { path: scripturePath } = payload
      // ❖ Security: Ensure the path is within our project.
      const fullPath = path.join(projectRoot, scripturePath)
      if (!fullPath.startsWith(projectRoot)) {
        throw new Error("Forbidden path.")
      }
      const content = await fs.readFile(fullPath, "utf-8")
      return { success: true, data: content }
    }

    throw new Error("Invalid command.")
  } catch (error) {
    console.error("Error in dradera oracle:", error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    })
  }
})
