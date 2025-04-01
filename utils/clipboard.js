/** locked is optional argument, it's a vue reactive with boolean value that used as feedback for the copy button, locking it briefly  */
export default async function ({ input, locked, lockTime = 300 }) {
  if (locked.value) return
  if (locked) locked.value = true // if its passed but value not true
  try {
    await navigator.clipboard.writeText(input)
    if (locked) setTimeout(() => (locked.value = false), lockTime)
    console.log(`⏬ copied to clipboard [${timestamp()}]`)
  } catch (err) {
    if (locked) locked.value = false
    console.error("❗ failed to copy, ", err)
  }
}
