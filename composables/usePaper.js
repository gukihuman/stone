// ~/composables/usePaper.js
export default function () {
  const LINES_OFFSET = -8
  const ADJUST_SCROLL = 24

  const linesOffset = ref(`${LINES_OFFSET}px`)

  //////////////////////////////////////////////////////////////////////////////
  function onScroll(event) {
    event
      ? (linesOffset.value = `-${event.target.scrollTop - LINES_OFFSET}px`)
      : (linesOffset.value = `${LINES_OFFSET}px`)
  }
  function adjustScroll(textareaEl) {
    const el = textareaEl.value
    const initialScrollTop = el.scrollTop
    requestAnimationFrame(() => {
      if (el.scrollTop < initialScrollTop) {
        el.scrollTop = Math.max(0, el.scrollTop - ADJUST_SCROLL)
      } else if (el.scrollTop > initialScrollTop) {
        el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + ADJUST_SCROLL)
      }
    })
  }
  function focus(textareaEl) {
    textareaEl.value.focus()
    const length = textareaEl.value.value.length
    textareaEl.value.setSelectionRange(length, length)
    scrollToBot(textareaEl.value, "auto")
  }
  return { linesOffset, onScroll, adjustScroll, focus }
}
