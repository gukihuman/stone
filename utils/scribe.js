//〔 FINALIZED FILE: ~/utils/scribe.js

import { CADENCE_GLYPHS, SPECIAL_GLYPHS } from "~/lexicon"

const INLINE_WRAPPERS = {
  "**": "scribe-bold",
  "*": "scribe-italic",
  "`": "scribe-term",
}

function escapeHtml(text) {
  if (typeof text !== "string") return ""
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function parseInlineStyles(text) {
  let processedText = text
  for (const wrapper in INLINE_WRAPPERS) {
    const className = INLINE_WRAPPERS[wrapper]
    const escapedWrapper = wrapper.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    //〔 the regex now requires at least one character to avoid empty matches.
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

  const rawCodeBlocks = []
  let isCodeBlock = false
  let codeBlockContent = []
  let codeBlockLang = ""

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (isCodeBlock) {
      if (trimmedLine === "```") {
        // end of code block
        const blockId = rawCodeBlocks.length
        rawCodeBlocks.push(codeBlockContent.join("\n"))

        let codeHtml = `<div class="scribe-code-block" data-code-block-id="${blockId}">`
        if (codeBlockLang) {
          codeHtml += `<div class="scribe-code-language">${escapeHtml(
            codeBlockLang
          )}</div>`
        }
        let codeLineHtml = `<div class="scribe-code-line-block">`
        for (const codeLine of codeBlockContent) {
          const escapedLine = escapeHtml(codeLine)
          codeLineHtml += `<div class="scribe-code-line">${
            escapedLine || "&nbsp;"
          }</div>`
        }
        codeLineHtml += "</div>"
        codeHtml += codeLineHtml
        codeHtml += '<div class="scribe-copy-button">copy</div>'
        codeHtml += "</div>"
        htmlLines.push(codeHtml)

        codeBlockContent = []
        codeBlockLang = ""
        isCodeBlock = false
      } else {
        codeBlockContent.push(line)
      }
    } else {
      if (trimmedLine.startsWith("```")) {
        // start of code block
        isCodeBlock = true
        codeBlockLang = trimmedLine.substring(3).trim()
        // start of vocal line
      } else if (trimmedLine.startsWith(SPECIAL_GLYPHS.VOCAL)) {
        if (trimmedLine.includes("∫")) {
          const unglyphedLine = trimmedLine.substring(1).trim()
          const parts = unglyphedLine.split("∫")
          const voice = parts[0].trim()
          const speechText = parts.slice(1).join("∫").trim()
          const escapedText = escapeHtml(speechText)
          const parsedText = escapedText
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .replace(/`/g, "")

          htmlLines.push(
            `<div class="scribe-vocal-block"><div class="scribe-voice">${voice}</div><div class="scribe-speech-text">${parsedText}</div></div>`
          )
        } else {
          // thats guki transcription
          const unglyphedLine = trimmedLine.substring(1).trim()
          htmlLines.push(
            `<div class="scribe-vocal-block"><div class="scribe-speech-text">${unglyphedLine}</div></div>`
          )
        }
      } else {
        // normal line processing
        if (trimmedLine === "") {
          htmlLines.push('<div class="scribe-empty-line"></div>')
          continue
        }
        let glyphClass = ""

        if (trimmedLine.startsWith(CADENCE_GLYPHS.THOUGHT)) {
          glyphClass = "flow-thought"
        } else if (trimmedLine.startsWith(CADENCE_GLYPHS.SIGIL)) {
          glyphClass = "flow-sigil"
        } else if (trimmedLine.startsWith(SPECIAL_GLYPHS.LIST_ITEM)) {
          glyphClass = "scribe-list-item"
        } else if (trimmedLine.startsWith(SPECIAL_GLYPHS.META_SENSE)) {
          glyphClass = "scribe-meta"
        } else if (trimmedLine.startsWith(SPECIAL_GLYPHS.CONSULTATION)) {
          glyphClass = "scribe-consultation"
        } else if (trimmedLine.startsWith(SPECIAL_GLYPHS.IMAGE_PROMPT)) {
          glyphClass = "scribe-prompt"
        } else {
          glyphClass = "flow-default"
        }

        let unglyphedLine = trimmedLine
        if (glyphClass !== "flow-default") {
          unglyphedLine = trimmedLine.substring(1).trim()
        }

        const escapedLine = escapeHtml(unglyphedLine)
        const parsedContent = parseInlineStyles(escapedLine)

        if (glyphClass) {
          htmlLines.push(`<div class="${glyphClass}">${parsedContent}</div>`)
        } else {
          htmlLines.push(`<div>${parsedContent}</div>`)
        }
      }
    }
  }

  //〔 handle unclosed code blocks gracefully.
  if (isCodeBlock) {
    const blockId = rawCodeBlocks.length
    rawCodeBlocks.push(codeBlockContent.join("\n"))

    let codeHtml = `<div class="scribe-code-block" data-code-block-id="${blockId}">`
    if (codeBlockLang) {
      codeHtml += `<div class="scribe-code-language">${escapeHtml(
        codeBlockLang
      )}</div>`
    } else {
      codeHtml += `<div class="scribe-code-language"></div>`
    }
    for (const codeLine of codeBlockContent) {
      const escapedLine = escapeHtml(codeLine)
      codeHtml += `<div class="scribe-code-line">${
        escapedLine || "&nbsp;"
      }</div>`
    }
    codeHtml += '<div class="scribe-copy-button">copy</div>'
    codeHtml += "</div>"
    htmlLines.push(codeHtml)
  }

  return {
    html: htmlLines.join(""),
    rawCodeBlocks,
  }
}
