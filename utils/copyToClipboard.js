import timestamp from "./timestamp"

/** lockedRef is an optional argument, it's a vue ref with boolean value that used as feedback for the copy button, locking it briefly  */
export default async function (content, lockedRef, lockTime = 200) {
  if (lockedRef && lockedRef.value) return
  if (lockedRef) lockedRef.value = true
  try {
    await navigator.clipboard.writeText(content)
    if (lockedRef) setTimeout(() => (lockedRef.value = false), lockTime)
    console.log(`⏬ copied to clipboard [${timestamp()}]`)
  } catch (err) {
    if (lockedRef) lockedRef.value = false
    console.error("❗ failed to copy, ", err)
  }
}
