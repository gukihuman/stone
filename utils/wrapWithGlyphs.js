//〔 ~/utils/wrapWithGlyphs.js

import { SOURCE_GLYPHS } from "~/lexicon"

/**
 * 〔 wraps a string of content with the correct source glyphs.
 * 〔 it intelligently handles multi-line content to find the last-opened source.
 * 〔 @param {string} content - the raw text content to wrap.
 * 〔 @param {string} defaultSource - the source to use if no opening glyph is found.
 * 〔 @returns {string} the fully wrapped, commit-ready content.
 */
export default function wrapWithGlyphs(content, defaultSource) {
  if (!content.trim()) return ""
  let lines = content.trim().split("\n")

  // step 1: prepend opening glyph if missing.
  if (!lines[0]?.startsWith(SOURCE_GLYPHS.OPEN)) {
    lines.unshift(`${SOURCE_GLYPHS.OPEN}${defaultSource}`)
  }

  // step 2: append closing glyph if missing.
  const lastLine = lines[lines.length - 1]?.trim()
  if (!lastLine?.startsWith(SOURCE_GLYPHS.CLOSE)) {
    let sourceToClose = defaultSource
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith(SOURCE_GLYPHS.OPEN)) {
        sourceToClose = line.substring(1).trim()
        break
      }
    }
    lines.push(`${SOURCE_GLYPHS.CLOSE}${sourceToClose}`)
  }
  return lines.join("\n")
}
