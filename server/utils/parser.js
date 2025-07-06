// ~/server/utils/parser.js
import { SOURCE_GLYPHS, SPELL_GLYPHS, SOURCES } from "~/shared/lexicon"
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

  function finalizeSpell(isClosedWithGlyph = false) {
    if (currentSpell) {
      if (isClosedWithGlyph) {
        currentSpell.data = currentSpellData.join("\n").trim()
      }
      parsedLoom.spells.push(currentSpell)
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
      finalizeSpell(true)
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
  // The parts array now only contains parameters, so we start from index 0
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
