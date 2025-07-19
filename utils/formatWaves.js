// ~/utils/formatWaves.js
const SOURCE_GLYPHS = {
  OPEN: "◉",
  CLOSE: "◎",
}

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
    } else {
      formattedLines.push("")
    }
    formattedLines.push(wave.data)
    previousSource = currentSource
  })

  if (previousSource !== null) {
    formattedLines.push(`${SOURCE_GLYPHS.CLOSE}${previousSource}`)
  }

  return formattedLines.join("\n")
}
