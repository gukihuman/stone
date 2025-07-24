//〔 REFACTORED FILE: ~/utils/scribe.js

import { CADENCE_GLYPHS } from "~/lexicon"

const INLINE_WRAPPERS = {
  "**": "scribe-bold",
  "`": "scribe-term",
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function parseInlineStyles(text) {
  //〔 we do not escape here anymore. escaping happens at the code block level.
  let processedText = text
  for (const wrapper in INLINE_WRAPPERS) {
    const className = INLINE_WRAPPERS[wrapper]
    const escapedWrapper = wrapper.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    //〔 the regex now requires at least one character inside the wrapper.
    const regex = new RegExp(`${escapedWrapper}(.+?)${escapedWrapper}`, "g")
    processedText = processedText.replace(
      regex,
      `<span class="${className}">$1</span>`
    )
  }
  return processedText
}

export default function scribe(text) {
  if (!text || typeof text !== "string") return ""

  const lines = text.split("\n")
  const htmlLines = []

  let isCodeBlock = false
  let codeBlockContent = []

  for (const line of lines) {
    if (line.trim() === "```") {
      if (isCodeBlock) {
        // end of code block
        const escapedCode = escapeHtml(codeBlockContent.join("\n"))
        htmlLines.push(`<div class="scribe-code">${escapedCode}</div>`)
        codeBlockContent = []
        isCodeBlock = false
      } else {
        // start of code block
        isCodeBlock = true
      }
      continue
    }

    if (isCodeBlock) {
      codeBlockContent.push(line)
    } else {
      //〔 handle empty lines first.
      if (line.trim() === "") {
        htmlLines.push('<div class="scribe-empty-line"></div>')
        continue
      }

      const trimmedLine = line.trim()
      let glyphClass = ""

      //〔 we now only check for the glyph, we do not strip it.
      if (trimmedLine.startsWith(CADENCE_GLYPHS.SPARK)) {
        glyphClass = "flow-spark"
      } else if (trimmedLine.startsWith(CADENCE_GLYPHS.THOUGHT)) {
        glyphClass = "flow-thought"
      } else if (trimmedLine.startsWith(CADENCE_GLYPHS.VERSE)) {
        glyphClass = "flow-verse"
      }

      //〔 we escape the full line first, then parse for inline styles.
      const escapedLine = escapeHtml(trimmedLine)
      const parsedContent = parseInlineStyles(escapedLine)

      if (glyphClass) {
        htmlLines.push(`<div class="${glyphClass}">${parsedContent}</div>`)
      } else {
        htmlLines.push(`<div>${parsedContent}</div>`)
      }
    }
  }

  if (isCodeBlock) {
    const escapedCode = escapeHtml(codeBlockContent.join("\n"))
    htmlLines.push(`<div class="scribe-code">${escapedCode}</div>`)
  }

  return htmlLines.join("")
}
