// ~/utils/newId.js
export default function () {
  let id = ""
  while (id.length < 12) id += Math.random().toString(36).slice(2)
  return id.substring(0, 12)
}
