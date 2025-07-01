// ~/composables/useHotkeys.js
export default function useHotkeys() {
  const currentMode = ref("normal") // 'normal', 'input', or 'confirmation'

  function setMode(newMode) {
    if (["normal", "input", "confirmation"].includes(newMode)) {
      currentMode.value = newMode
    }
  }

  function setupHotkeys(shortcutMaps) {
    function handleKeyDown(e) {
      const modeShortcuts = shortcutMaps[currentMode.value]
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

  return { currentMode, setMode, setupHotkeys }
}
