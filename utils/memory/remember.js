export default function (events, eventName, entity, memoryObject) {
  const event = events.find((event) => event.name === eventName)
  memoryObject.tokens = getTokens(memoryObject.text)
  if (!event.memory[entity]) event.memory[entity] = []
  memoryObject.id = newId()
  event.memory[entity].push(memoryObject)
  events.upsertDBSync(event)
}
