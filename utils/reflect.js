export default function (events, eventName, entity, memoryObject, memoryId) {
  const event = events.find((e) => e.name === eventName && e.memory[entity])
  memoryObject.tokens = getTokens(memoryObject.text)
  const indexToUpdate = event.memory[entity].findIndex(
    ({ id }) => id === memoryId
  )
  if (indexToUpdate === -1) return
  memoryObject.id = memoryId
  event.memory[entity][indexToUpdate] = memoryObject
  events.upsertDBSync(event)
}
