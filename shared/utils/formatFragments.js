// ~/shared/utils/formatFragments.js
import { SOURCE_GLYPHS } from "~/shared/lexicon"

export default function (waves) {
  if (!waves || !waves.length) return ""

  const formattedLines = []
  let previousSource = null

  waves.forEach((wave) => {
    const currentSource = wave.source
    if (currentSource !== previousSource) {
      if (previousSource !== null) {
        formattedLines.push(`${SOURCE_GLYPHS.CLOSE}${previousSource}\n`)
      }
      formattedLines.push(`${SOURCE_GLYPHS.OPEN}${currentSource}`)
    }
    formattedLines.push(wave.data)
    previousSource = currentSource
  })

  if (previousSource !== null) {
    formattedLines.push(`${SOURCE_GLYPHS.CLOSE}${previousSource}`)
  }

  return formattedLines.join("\n")
}
