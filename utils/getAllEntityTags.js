export default function (events, entity) {
  const uniqueTags = new Set()
  events.forEach((event) => {
    if (!event.memory[entity]) return
    event.memory[entity].forEach((memory) => {
      memory.tags.forEach((tag) => uniqueTags.add(tag))
    })
  })
  return Array.from(uniqueTags)
}
