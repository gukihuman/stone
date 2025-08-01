// ~/composables/useHotkeys.js
export default function useHotkeys() {
  const currentHotkeysMode = ref("normal") // normal, input, or confirm

  function setHotkeysMode(newMode) {
    if (["normal", "input", "confirm"].includes(newMode)) {
      currentHotkeysMode.value = newMode
    }
  }

  function setHotkeysShortcuts(shortcutMaps) {
    function handleKeyDown(e) {
      const modeShortcuts = shortcutMaps[currentHotkeysMode.value]
      if (!modeShortcuts) return

      const handler = modeShortcuts[e.key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }

  return { currentHotkeysMode, setHotkeysMode, setHotkeysShortcuts }
}
