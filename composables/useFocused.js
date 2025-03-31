export default function useFocusedItem() {
  const LINES_OFFSET = -8
  const ADJUST_SCROLL = 24

  const isTextareaFocused = ref(false)
  const linesOffset = ref(`${LINES_OFFSET}px`)

  //////////////////////////////////////////////////////////////////////////////
  function onFocus(emit) {
    isTextareaFocused.value = true
    emit("lock-hotkeys")
  }
  function onBlur(emit) {
    isTextareaFocused.value = false
    emit("unlock-hotkeys")
  }
  function onScroll(event) {
    event
      ? (linesOffset.value = `-${event.target.scrollTop - LINES_OFFSET}px`)
      : (linesOffset.value = `${LINES_OFFSET}px`)
  }
  function adjustScrollTop(textareaEl) {
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
  function focusName(nameEl) {
    nameEl.value.focus()
    nameEl.value.setSelectionRange(0, nameEl.value.value.length)
  }
  function focus(textareaEl) {
    textareaEl.value.focus()
    const length = textareaEl.value.value.length
    textareaEl.value.setSelectionRange(length, length)
    scrollToBot(textareaEl.value, "auto")
  }
  return {
    LINES_OFFSET,
    isTextareaFocused,
    linesOffset,
    onFocus,
    onBlur,
    onScroll,
    adjustScrollTop,
    focusName,
    focus,
  }
}
