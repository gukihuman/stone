export default function (events, eventName, entity, memoryId) {
  const event = events.find((event) => event.name === eventName)
  const indexToRemove = event.memory[entity].findIndex(
    ({ id }) => id === memoryId
  )
  if (indexToRemove !== -1) event.memory[entity].splice(indexToRemove, 1)
  events.upsertDBSync(event)
}
