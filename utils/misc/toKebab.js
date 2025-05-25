// ~/utils/misc/toKebab.js
export default function (str) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase()
}
