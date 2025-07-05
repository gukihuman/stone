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
      finalizeWave() // forgiving parser, finilizes unclosed wave just in case
      finalizeSpell() // same for spells, just in case
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
      finalizeSpell() // one line spells without data
    } else if (trimmedLine.startsWith(SPELL_GLYPHS.OPEN)) {
      finalizeSpell() // one line spells without data
      const [verb, ...params] = trimmedLine.substring(1).trim().split(/\s+/)
      currentSpell = {
        verb,
        params: parseParameters(params),
        data: null,
      }
      currentWaveData.push(line) // spells still part of the wave data
    } else if (trimmedLine.startsWith(SPELL_GLYPHS.CLOSE)) {
      finalizeSpell(true) // multi line spells with data
      currentWaveData.push(line) // spells still part of the wave data
    } else {
      // this is a data line
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
