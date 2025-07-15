// ~/utils/formatTokens.js
export default function (number) {
  if (number === 0) return "0"
  if (number < 100) return `~${number}`

  if (number < 1000000) {
    // k for thousands
    const value = number / 1000
    return `~${value.toFixed(1)}k`
  } else {
    // m for millions
    const value = number / 1000000
    return `~${value.toFixed(1)}m`
  }
}
