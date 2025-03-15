export default function (events, topics, selectedTopics, focusedEvent) {
  const topicsPart = selectedTopics.reduce((topicAcc, level, i) => {
    const eventsPart = events.reduce((eventAcc, event) => {
      try {
        const memory = JSON.parse(event.memoryRaw)
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
    ...(topicsPart.length ? [`## existing memories by topics`] : []),
    ...topicsPart,
    `## ongoing current event`,
    `${focusedEvent.name} ${focusedEvent.date.substring(0, 10)}`,
    focusedEvent.text,
  ].join("\n\n")
}
