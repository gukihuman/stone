import timestamp from "~/utils/timestamp"

/** locked and lockedField are optional arguments, it's a vue reactive with boolean lockedField that used as feedback for the copy button, locking it briefly  */
export default async function ({
  message,
  locked,
  lockedField,
  lockTime = 300,
}) {
  if (locked && locked[lockedField]) return
  if (locked) locked[lockedField] = true
  try {
    await navigator.clipboard.writeText(message)
    if (locked) setTimeout(() => (locked[lockedField] = false), lockTime)
    console.log(`⏬ copied to clipboard [${timestamp()}]`)
  } catch (err) {
    if (locked) locked[lockedField] = false
    console.error("❗ failed to copy, ", err)
  }
}
