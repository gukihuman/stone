// ~/server/utils/parser.js
import {
  SOURCE_GLYPHS,
  SPELL_GLYPHS,
  SOURCES,
  MULTI_LINE_SPELLS,
  ONE_LINE_SPELLS,
} from "~/lexicon"
import newId from "~/utils/newId"

export default function parseLoom(loomContent) {
  const lines = loomContent.trim().split("\n")
  const parsedLoom = { waves: [], spells: [] }

  let currentWave = null
  let currentWaveData = []
  let currentSpell = null // Now only used for multi-line spells
  let currentSpellData = []

  function finalizeWave() {
    if (currentWave) {
      currentWave.data = currentWaveData.join("\n").trim()
      if (currentWave.data) parsedLoom.waves.push(currentWave)
      currentWave = null
      currentWaveData = []
    }
    if (currentSpell) finalizeSpell() // forgiving parser
  }

  function finalizeSpell() {
    currentSpell.data = currentSpellData.join("\n").trim()
    parsedLoom.spells.push(currentSpell)
    currentSpell = null
    currentSpellData = []
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (currentSpell) {
      if (trimmedLine.startsWith(SPELL_GLYPHS.CLOSE)) {
        const closeVerb = trimmedLine.substring(1).trim().replace(/\s+/g, "_")
        if (currentSpell.verb === closeVerb) {
          finalizeSpell(closeVerb)
        }
      } else {
        // Any other line, even one with a `⫸`, is just data.
        currentSpellData.push(line)
      }
      // Always add the line to the wave data for historical purity.
      if (currentWave) {
        currentWaveData.push(line)
      }
      continue // Skip all other checks for this line.
    }

    if (trimmedLine.startsWith(SOURCE_GLYPHS.OPEN)) {
      finalizeWave()
      const source = trimmedLine.substring(1).trim()
      if (Object.values(SOURCES).includes(source)) {
        currentWave = {
          _id: newId(),
          timestamp: Date.now(),
          source: source,
          density: 0,
          provenance: [],
          apotheosis: null,
        }
      }
    } else if (trimmedLine.startsWith(SOURCE_GLYPHS.CLOSE)) {
      finalizeWave()
    } else if (trimmedLine.startsWith(SPELL_GLYPHS.OPEN)) {
      const parts = trimmedLine.substring(1).trim().split(/\s+/)
      const verbParts = []
      const paramParts = []
      let foundParams = false
      for (const part of parts) {
        if (part.startsWith("-")) foundParams = true
        if (foundParams) paramParts.push(part)
        else verbParts.push(part)
      }
      const verb = verbParts.join("_")

      if (Object.values(MULTI_LINE_SPELLS).includes(verb)) {
        // It's a multi-line spell, start collecting data.
        currentSpell = {
          verb,
          params: parseParameters(paramParts),
          data: null,
        }
      } else {
        // It's a one-line spell, create and push it immediately.
        parsedLoom.spells.push({
          verb,
          params: parseParameters(paramParts),
          data: null,
        })
      }
      currentWaveData.push(line)
    } else {
      if (currentWave) {
        currentWaveData.push(line)
      }
    }
  }

  finalizeWave()

  return parsedLoom
}

function parseParameters(parts) {
  const params = {}
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("-")) {
      const key = parts[i].substring(1)
      const value = parts[i + 1]
      if (value && !value.startsWith("-")) {
        params[key] = value
        i++
      } else {
        params[key] = true
      }
    }
  }
  return params
}
