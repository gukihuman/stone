export default function (number, devider = 1) {
  const result = Math.round(number / devider)
    .toString(2)
    .split("")
    .map((bit) => (bit === "0" ? "╻" : "┃"))
    .join("")
  const array = []
  for (let i = 0; i < result.length; i += 4) {
    array.unshift(
      result.slice(Math.max(0, result.length - i - 4), result.length - i)
    )
  }
  return array
}
