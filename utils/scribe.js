//〔 ~/utils/scribe.js

import { CADENCE_GLYPHS } from "~/lexicon"

/**
 * 〔 takes a raw text string from our flow and transmutes it into
 * 〔 a styled html string with our bespoke visual language.
 * 〔 @param {string} text - the raw text content.
 * 〔 @returns {string} the rendered html string.
 */
export default function scribe(text) {
  if (!text || typeof text !== "string") return ""

  const lines = text.split("\n")
  const htmlLines = []

  for (const line of lines) {
    const trimmedLine = line.trim()

    //〔 phase 1: handle the cadence glyphs.
    if (trimmedLine.startsWith(CADENCE_GLYPHS.SPARK)) {
      const content = trimmedLine.substring(1).trim()
      htmlLines.push(`<div class="flow-spark">${content}</div>`)
    } else if (trimmedLine.startsWith(CADENCE_GLYPHS.THOUGHT)) {
      const content = trimmedLine.substring(1).trim()
      htmlLines.push(`<div class="flow-thought">${content}</div>`)
    } else if (trimmedLine.startsWith(CADENCE_GLYPHS.VERSE)) {
      const content = trimmedLine.substring(1).trim()
      htmlLines.push(`<div class="flow-verse">${content}</div>`)
    } else {
      //〔 for now, un-glyphed lines are rendered as simple divs.
      htmlLines.push(`<div>${line}</div>`)
    }
  }

  return htmlLines.join("")
}
