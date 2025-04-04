export default function (events, eventName, entity, appState) {
  console.log("tf")
  const event = events.find((event) => event.name === eventName)
  const result = []
  event.memory[entity].forEach((memory) => {
    result.push({
      event: event.name,
      text: memory.text,
      tags: memory.tags,
      id: memory.id,
    })
  })
  console.log(result)
  appState.upsertDBSync(
    "draft",
    `${appState.draft}\n\n${JSON.stringify(result)}`
  )
}
