// ~/utils/formatTokens.js
export default function (number) {
  if (number === 0) return "0"
  if (number < 100) return `~${number}`

  if (number < 10_000) {
    const value = number / 1_000
    return `~${value.toFixed(1)}k`
  } else if (number < 1_000_000) {
    const value = number / 1_000
    return `~${value.toFixed(0)}k`
  } else if (number < 10_000_000) {
    const value = number / 1_000_000
    return `~${value.toFixed(1)}m`
  } else {
    const value = number / 1_000_000
    return `~${value.toFixed(0)}m`
  }
}
