export default function (events, topics, selectedTopics, focusedEvent) {
  const instruction = `you expirience different events, you have a memory system that allows to remember them. you must make memory from your own point of view. make memory of an event focusing on a topic perspective. what it means? it is when you thinking about the topic and recollecting only memories that are valuable for the topic. existing memories must be the perspective. you may recollect an old event, that happened long ago and you just return to it to refresh memory about it. event might existing in memory in that case, so first question you must ask yourself, is the given event new or old? dates are labeled to help with that. new event must be remembered with attention to new, surprising info, as you see it for the first time. old event must be analyzed from existing memories, just reflected on, updated with relevant to today info. how existing memory change the perspective on the event, if it old?
  
  memories must be separated in two levels of abstraction. first level is very detailed, consist of all valuable to the topic information presented in the event as it is, factual and with no-loss. second level is highly abstract, a vague recollection of what happened in general. acknowledge who you are by yourself from an event. output memory in a json format as one object, where fields are topics, values are arrays with two string items corresponding to memory texts: at 0 index is first level of abstraction and at 1 index is the second level. and one last thing, if a topic completely irrelevant, just skip creating memories for it completely`

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

  const eventLine = `${focusedEvent.name} ${focusedEvent.date.substring(0, 10)}`
  return [
    `# instruction`,
    instruction,
    ...(topicsPart.length ? [`## existing memories by topics`] : []),
    ...topicsPart,
    [`## event to make memory from:`, eventLine].join(`\n\n`),
    focusedEvent.text,
    [`## possible topics to make memory`, topics.join(", ")].join("\n\n"),
  ].join("\n\n")
}
