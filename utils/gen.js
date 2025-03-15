/**
 * Streaming response handler
 * responseType options:
 * - string: full response
 * - jsonObject: captures first {} including braces
 * - jsonStringParsed: captures content inside first [""] excluding [""]
 */
const RESPONSE_TYPE_CONFIGS = {
  string: {
    startSymbol: "",
    endSymbol: "",
    includeSymbols: true,
    // String type captures everything by default
  },
  jsonObject: {
    startSymbol: "{",
    endSymbol: "}",
    includeSymbols: true,
  },
  jsonStringParsed: {
    startSymbol: '["',
    endSymbol: '"]',
    includeSymbols: false,
  },
}

export default async function ({
  message,
  event,
  eventField,
  locked,
  lockedField,
  onNextChunk,
  responseType = "string",
}) {
  locked[lockedField] = true

  const config =
    RESPONSE_TYPE_CONFIGS[responseType] || RESPONSE_TYPE_CONFIGS.string

  const response = await fetch("/api/gen", {
    method: "POST",
    body: JSON.stringify({ input: message }),
    headers: {
      "Content-Type": "application/json",
    },
  })

  let capturing = config.startSymbol === "" ? true : false
  let startSymbolIndex = 0
  let endSymbolIndex = 0
  let buffer = ""

  const reader = response.body.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = new TextDecoder().decode(value)
    buffer += chunk

    // Logic for finding the start position
    if (!capturing) {
      // For jsonStringParsed, we need to match ["
      // For other types, we match the entire startSymbol at once
      let searchStartPos = 0

      while (searchStartPos < buffer.length) {
        if (buffer[searchStartPos] === config.startSymbol[startSymbolIndex]) {
          startSymbolIndex++
          if (startSymbolIndex === config.startSymbol.length) {
            // We found the complete start symbol
            capturing = true
            const captureStartPos = searchStartPos - startSymbolIndex + 1

            // If we should include the symbols, start from the beginning of the symbol
            // Otherwise, start after the symbol
            const sliceStartPos = config.includeSymbols
              ? captureStartPos
              : captureStartPos + config.startSymbol.length

            buffer = buffer.substring(sliceStartPos)
            break
          }
        } else if (startSymbolIndex > 0) {
          // If we've started matching but hit a non-match, don't reset completely
          // This is only relevant for multi-character symbols like ["
          startSymbolIndex = 0
        }
        searchStartPos++
      }
    }

    // Process chunk if we're capturing
    if (capturing) {
      // Check for end symbol if we have one
      if (config.endSymbol) {
        let endPos = -1

        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === config.endSymbol[endSymbolIndex]) {
            endSymbolIndex++
            if (endSymbolIndex === config.endSymbol.length) {
              endPos = i - endSymbolIndex + 1
              break
            }
          } else if (endSymbolIndex > 0) {
            // Similar to start symbol logic, don't reset completely on non-match
            endSymbolIndex = 0
          }
        }

        if (endPos >= 0) {
          // We found the end symbol
          const finalChunk = config.includeSymbols
            ? buffer.substring(0, endPos + config.endSymbol.length)
            : buffer.substring(0, endPos)

          event[eventField] += finalChunk
          onNextChunk(event)
          break // Stop processing further chunks
        }
      }

      // If no end symbol found or it's not complete yet, add the entire buffer
      event[eventField] += buffer
      onNextChunk(event)
      buffer = ""
    }
  }

  locked[lockedField] = false
}
