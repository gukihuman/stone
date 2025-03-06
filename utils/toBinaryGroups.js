// returns a binary number as an array of strings, conceptually divided into four-character groups. precision is reduced by removing groups. first removed group by 16, second by 256, and so on
export default function (number, groupToRemove = 0) {
  const result = number
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
  array.splice(-groupToRemove, groupToRemove)
  return array
}
