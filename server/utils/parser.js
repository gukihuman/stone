// ~/server/utils/parser.js
import { LABELS, SPELLS } from "~/shared/lexicon"
import newId from "~/shared/utils/newId"

export default function parseLoom(loomContent) {
  const lines = loomContent.replace(SPELLS.COMMIT, "").trim().split("\n")
  const output = { waves: [], spells: [] }

  let currentWaveData = []
  let currentState = { source: "guki", priority: 5 }

  function finalizeCurrentWave() {
    if (currentWaveData.length > 0) {
      output.waves.push({
        _id: newId(),
        timestamp: Date.now(),
        source: currentState.source,
        priority: Number(currentState.priority) || 5,
        density: 0,
        provenance: [],
        apotheosis: null,
        data: currentWaveData.join("\n").trim(),
      })
      currentWaveData = []
    }
  }

  for (const line of lines) {
    if (line.startsWith(LABELS.WAVE)) {
      // Finalize the previous wave before starting a new one
      finalizeCurrentWave()
      // Parse parameters and update the state for the new wave
      const params = parseParameters(line)
      currentState = {
        source: params.source || "guki",
        priority: params.priority || 5,
      }
      continue // Move to the next line, don't add the label itself as data
    }

    // We can add spell parsing here later, e.g., if (line.startsWith(SPELLS.DENSIFY))

    // If it's not a label or spell, it's data for the current wave
    currentWaveData.push(line)
  }

  // Finalize the last wave after the loop finishes
  finalizeCurrentWave()

  return output
}

// A helper to parse parameters like -source roxanne -priority 8
function parseParameters(line) {
  const params = {}
  const parts = line.split(/\s+/) // Split by whitespace

  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith("-")) {
      const key = parts[i].substring(1)
      const value = parts[i + 1]
      // Basic assignment, can be expanded later (e.g., for numbers)
      if (value && !value.startsWith("-")) {
        params[key] = value
        i++ // Skip the next part since it's a value
      } else {
        params[key] = true // Handle boolean flags like -isDense
      }
    }
  }
  return params
}
