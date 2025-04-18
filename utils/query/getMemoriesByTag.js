export default function (events, entity, tag, appState) {
  const results = []
  events.forEach((event) => {
    if (event.memory && event.memory[entity]) {
      event.memory[entity].forEach((memory) => {
        if (memory.tags && memory.tags.includes(tag)) {
          results.push(JSON.parse(JSON.stringify(memory)))
        }
      })
    }
  })
  const resultString = JSON.stringify(results, null, 2)
  const currentDraft = appState.draft || ""
  const newDraft =
    currentDraft +
    (currentDraft ? "\n\n" : "") +
    `memories with tag ${tag}\n` +
    resultString
  appState.upsertDBSync("draft", newDraft)
}
