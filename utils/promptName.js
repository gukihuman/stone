export default function (events, topics, selectedTopics, focusedEvent) {
  const instruction = `your task is to name a given event. existing memories are for context only. name the text presented as given event. name should be lowercase, no special symbols, even commas, and most importantly short. use existing even names as reference. deeply reason about names first, then provide a json as an array with one string item. so the output is like:
  
  deep reasoning monologue text
  ["final name"]`

  const topicsPart = selectedTopics.reduce((topicAcc, level, i) => {
    const eventsPart = events.reduce((eventAcc, event) => {
      try {
        const memory = JSON.parse(event.memory)
        if (memory[topics[i]]?.[level]) {
          eventAcc.push(
            [
              `#### ${event.name} ${event.date.substring(0, 10)}`,
              memory[topics[i]][level],
            ].join("\n\n")
          )
        }
      } catch (e) {}
      return eventAcc
    }, [])
    if (eventsPart.length) {
      topicAcc.push([`### ${topics[i]}`, ...eventsPart].join("\n\n"))
    }
    return topicAcc
  }, [])

  return [
    `# instruction`,
    instruction,
    ...(topicsPart.length ? [`## existing memories by topics`] : []),
    ...topicsPart,
    [`## event to name `, focusedEvent.date.substring(0, 10)].join(`\n\n`),
    focusedEvent.text,
  ].join(`\n\n`)
}
