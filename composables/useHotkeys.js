export default function () {
  const hotkeysLockedByInput = ref(false)

  function resetFocus() {
    if (document.activeElement) document.activeElement.blur()
    hotkeysLockedByInput.value = false
  }
  function setupHotkeys(shortcuts) {
    function handleKeyDown(e) {
      // if input focused, only handle Escape
      if (hotkeysLockedByInput.value) {
        if (e.key === "Escape") resetFocus()
        return
      }
      const handler = shortcuts[e.key]
      if (handler) {
        handler()
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }
  return { hotkeysLockedByInput, setupHotkeys }
}
