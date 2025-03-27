const CONFIG = {
  text: { erase: false, start: "", end: "", include: true },
  name: { erase: true, start: '["', end: '"]', include: false },
  memory: { erase: true, start: "{", end: "}", include: true },
}
export default async function ({
  model,
  input,
  event,
  field,
  locked,
  onNextChunk,
  focusedEntity,
}) {
  locked[field] = true

  const config = CONFIG[field] || CONFIG.text

  const response = await fetch("/api/gen", {
    method: "POST",
    body: JSON.stringify({ input, model }),
    headers: { "Content-Type": "application/json" },
  })

  let capturing = config.start === "" ? true : false
  let startIndex = 0
  let endIndex = 0
  let buffer = ""

  const reader = response.body.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = new TextDecoder().decode(value)

    if (chunk.startsWith("ERROR: ")) {
      if (field === memory) {
        event.memory[focusedEntity] += `${chunk.substring(7)}`
      } else {
        event[field] += `${chunk.substring(7)}`
      }
      break
    }

    buffer += chunk
    console.log(chunk)

    // logic for finding the start position
    if (!capturing) {
      // for name, we need to match ["
      // for other types, we match the entire start at once
      let searchStartPos = 0

      while (searchStartPos < buffer.length) {
        if (buffer[searchStartPos] === config.start[startIndex]) {
          startIndex++
          if (startIndex === config.start.length) {
            // we found the complete start symbol
            capturing = true
            const captureStartPos = searchStartPos - startIndex + 1

            if (config.erase && field === "memory") {
              event.memory[focusedEntity] = ""
            } else if (config.erase) {
              event[field] = ""
            }

            // if we should include the symbols, start from the beginning of the symbol, otherwise, start after the symbol
            const sliceStartPos = config.include
              ? captureStartPos
              : captureStartPos + config.start.length

            buffer = buffer.substring(sliceStartPos)
            break
          }
        } else if (startIndex > 0) {
          // if we've started matching but hit a non-match, don't reset completely, this is only relevant for multi-character symbols like ["
          startIndex = 0
        }
        searchStartPos++
      }
    }

    // process chunk if we're capturing
    if (capturing) {
      // check for end symbol if we have one
      if (config.end) {
        let endPos = -1

        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === config.end[endIndex]) {
            endIndex++
            if (endIndex === config.end.length) {
              endPos = i - endIndex + 1
              break
            }
          } else if (endIndex > 0) {
            // similar to start logic, don't reset completely on non-match
            endIndex = 0
          }
        }

        if (endPos >= 0) {
          // we found the end symbol
          const finalChunk = config.include
            ? buffer.substring(0, endPos + config.end.length)
            : buffer.substring(0, endPos)

          if (field === "memory") {
            event.memory[focusedEntity] += finalChunk
          } else {
            event[field] += finalChunk
          }
          onNextChunk(event)
          break // Stop processing further chunks
        }
      }

      // if no end symbol found or it's not complete yet, add the entire buffer
      if (field === "memory") {
        event.memory[focusedEntity] += buffer
      } else {
        event[field] += buffer
      }

      onNextChunk(event)
      buffer = ""
    }
  }

  locked[field] = false
}
