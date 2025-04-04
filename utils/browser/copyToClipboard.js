import timestamp from "~/utils/timestamp"

/** locked and field are optional arguments, it's a vue reactive with boolean field that used as feedback for the copy button, locking it briefly  */
export default async function ({ input, locked, field, lockTime = 300 }) {
  if (locked && locked[field]) return
  if (locked) locked[field] = true
  try {
    await navigator.clipboard.writeText(input)
    if (locked) setTimeout(() => (locked[field] = false), lockTime)
    console.log(`⏬ copied to clipboard [${timestamp()}]`)
  } catch (err) {
    if (locked) locked[field] = false
    console.error("❗ failed to copy, ", err)
  }
}
