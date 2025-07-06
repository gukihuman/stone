// ~/server/utils/parser.js
import {
  SOURCE_GLYPHS,
  SPELL_GLYPHS,
  SOURCES,
  SPELL_VERBS,
} from "~/shared/lexicon"
import newId from "~/shared/utils/newId"

export default function parseLoom(loomContent) {
  const lines = loomContent.trim().split("\n")
  const parsedLoom = { waves: [], spells: [] }

  let currentWave = null
  let currentWaveData = []
  let currentSpell = null
  let currentSpellData = []

  function finalizeWave() {
    if (currentWave) {
      currentWave.data = currentWaveData.join("\n").trim()
      if (currentWave.data) parsedLoom.waves.push(currentWave)
      currentWave = null
      currentWaveData = []
    }
  }

  function finalizeSpell(isClosedWithGlyph = false, closeVerb = "") {
    if (currentSpell) {
      if (isClosedWithGlyph) {
        if (currentSpell.verb === closeVerb) {
          // Happy Path: Verbs match, spell is valid.
          currentSpell.data = currentSpellData.join("\n").trim()
          parsedLoom.spells.push(currentSpell)
        } else {
          // Error Path: Mismatch, spell is discarded.
          console.error(
            `[Parser Error] Spell mismatch: Opened with '${currentSpell.verb}' but attempted to close with '${closeVerb}'. Spell will be discarded.`
          )
        }
      } else {
        // Case for single-line spells (no closing glyph).
        parsedLoom.spells.push(currentSpell)
      }
      // Reset state for ALL cases where a spell was being processed.
      currentSpell = null
      currentSpellData = []
    }
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith(SOURCE_GLYPHS.OPEN)) {
      finalizeWave()
      finalizeSpell()
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
      finalizeSpell()
    } else if (trimmedLine.startsWith(SPELL_GLYPHS.OPEN)) {
      finalizeSpell()
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
      currentSpell = {
        verb,
        params: parseParameters(paramParts),
        data: null,
      }
      currentWaveData.push(line)
    } else if (trimmedLine.startsWith(SPELL_GLYPHS.CLOSE)) {
      const closeVerb = trimmedLine.substring(1).trim().replace(/\s+/g, "_")
      finalizeSpell(true, closeVerb)
      currentWaveData.push(line)
    } else {
      if (currentWave) currentWaveData.push(line)
      if (currentSpell) currentSpellData.push(line)
    }
  }

  finalizeSpell()
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
