export default function (events, topics, selectedTopics, focusedEvent) {
  const instruction = `you expirience different events, you have a memory system that allows to remember them. you must make memory from your own point of view. make memory of an event focusing on a topic perspective. what it means? it is when you thinking about the topic and recollecting only memories that are valuable for the topic. existing memories must be the perspective. you may recollect an old event, that happened long ago and you just return to it to refresh memory about it. event might existing in memory in that case, so first question you must ask yourself, is the given event new or old? new event must be remembered with attention to new, surprising info, as you see it for the first time. old event must be analyzed from existing memories, just reflected on, with acknowledged contradictions of more recent info, and updated with only relevant to today info. how existing memory change the perspective on the event, if its old?
  
  memories must be separated in two levels of abstraction. first level is very detailed, consist of all valuable to the topic information presented in the event as it is, factual and with no loss of info: that means it should absolutely clearly capture all the facts, all the details with no loss. only exception is date, no need to mention date in memories because it is handled by memory system itself. second level is highly abstract, a vague recollection of what happened in general. acknowledge who you are by yourself from an event. output memory in a json format as one object, where fields are topics, values are arrays with two string items corresponding to memory texts: at 0 index is first level of abstraction and at 1 index is the second level. and one last thing, you can pick only relevant topics, if a topic completely irrelevant, just skip creating memories for it completely.

  output format should also consist of a deep reasoning about given event, before the json file, its ok, parser gonna save in memory only json. reasoning is for now, for making more clear what needs to be done with given event. its new or its already in memory and just needs to be reevaluated? so the output is like:

  deep reasoning monologue text
  { "topic name": [ "no loss long text", "short vague abstraction text" ] }
  `

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
    `# instruction`,
    instruction,
    ...(topicsPart.length ? [`## existing memories by topics`] : []),
    ...topicsPart,
    `## event to make memory from`,
    `${focusedEvent.name} ${focusedEvent.date.substring(0, 10)}`,
    focusedEvent.text,
    [`## possible topics to make memory`, topics.join(", ")].join("\n\n"),
  ].join("\n\n")
}
