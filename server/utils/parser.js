// ~/server/utils/parser.js
import {
  SOURCE_GLYPHS,
  SPELL_GLYPHS,
  SOURCES,
  MULTI_LINE_SPELLS,
  ONE_LINE_SPELLS,
} from "~/shared/lexicon"
import newId from "~/shared/utils/newId"

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
  }

  // FinalizeSpell is now only for multi-line spells
  function finalizeSpell(closeVerb = "") {
    if (currentSpell) {
      if (currentSpell.verb === closeVerb) {
        currentSpell.data = currentSpellData.join("\n").trim()
        parsedLoom.spells.push(currentSpell)
      } else {
        console.error(
          `[Parser Error] Spell mismatch: Opened with '${currentSpell.verb}' but attempted to close with '${closeVerb}'. Spell will be discarded.`
        )
      }
      currentSpell = null
      currentSpellData = []
    }
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (currentSpell) {
      // inside a multi-line spell all lines are data until the closer glyph
      if (trimmedLine.startsWith(SPELL_GLYPHS.CLOSE)) {
        const closeVerb = trimmedLine.substring(1).trim().replace(/\s+/g, "_")
        finalizeSpell(closeVerb)
        currentWaveData.push(line)
      } else {
        currentSpellData.push(line)
        currentWaveData.push(line)
      }
    } else if (trimmedLine.startsWith(SOURCE_GLYPHS.OPEN)) {
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
      } else if (Object.values(ONE_LINE_SPELLS).includes(verb)) {
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
