export default function (events, topics, files, appState) {
  const focusedEvent = events[appState.focusedIndex]

  const eventsPart = events.reduce((eventAcc, event, eventIndex) => {
    if (
      appState.focusedList === "events" &&
      eventIndex === appState.focusedIndex
    ) {
      return eventAcc
    }
    if (appState.selectedEvents[eventIndex]) {
      eventAcc.push(
        [`### ${event.name} ${event.date.substring(0, 10)}`, event.text].join(
          "\n\n"
        )
      )
    }
    return eventAcc
  }, [])
  const allEventsList = events
    .map((event) => `${event.name} ${event.date.substring(0, 10)}`)
    .join("\n")

  const instruction = `you expirience different events, you have a memory system that allows to remember them. you must make memory from your own point of view. make memory of an event focusing on a topic perspective. what it means? it is when you thinking about the topic and recollecting only memories that are valuable for the topic. existing memories must be the perspective. you may recollect an old event, that happened long ago and you just return to it to refresh memory about it. event might existing in memory in that case, so first question you must ask yourself, is the given event new or old? new event must be remembered with attention to new, surprising info, as you see it for the first time. old event must be analyzed from existing memories, just reflected on, with acknowledged contradictions of more recent info, and updated with only relevant to today info. how existing memory change the perspective on the event, if its old?
  
  memories must be separated in two levels of abstraction. first level is very detailed, consist of all valuable to the topic information presented in the event as it is, factual and with no loss of info: that means it should absolutely clearly capture all the facts, all the details with no loss. only exception is date, no need to mention date in memories because it is handled by memory system itself. second level is highly abstract, a vague recollection of what happened in general. acknowledge who you are by yourself from an event. output memory in a json format as one object, where fields are topics, values are arrays with two string items corresponding to memory texts: at 0 index is first level of abstraction and at 1 index is the second level. and one last thing, you can pick only relevant topics, if a topic completely irrelevant, just skip creating memories for it completely.

  output format should also consist of a deep reasoning about given event, before the json file, its ok, parser gonna save in memory only json. reasoning is for now, for making more clear what needs to be done with given event. remember not to use " double qoutes like this inside json, they make it invalid. regarding reasoning, ask yourself, its new or its already in memory and just needs to be reevaluated? so the output is like:

  deep reasoning monologue text
  { "topic name": [ "no loss long text", "short vague abstraction text" ] }
  `

  const topicsPart = appState.selectedTopics.reduce((topicAcc, level, i) => {
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
  const filesPart = files.reduce((fileAcc, file, fileIndex) => {
    if (appState.selectedFiles[fileIndex]) {
      fileAcc.push(`### ${file.path}\n\n${file.content}`)
    }
    return fileAcc
  }, [])
  const allFilesList = files.map((file) => file.path).join("\n")

  return [
    `# context`,
    instruction,
    ...(topicsPart.length
      ? [`## existing memories by topics`, ...topicsPart]
      : []),
    ...(filesPart.length
      ? [
          `## files from folder ${appState.filesPath}`,
          `${allFilesList}`,
          `all files listed here are the most relevant, latest versions, directly from file system. other file references appearing in ongoing event, if any, might be outdated. some of them might be selected and their content gonna be presented below. all of them here is simply to understand broader concept of current folder. also it can be suggested to select a file / files if needed during event`,
          ...filesPart,
        ]
      : []),
    ...(eventsPart.length
      ? [
          `## events that happened by order they happened`,
          `${allEventsList}`,
          `events listed here are direct records of what already happened. some are present below, its important to understand, that its only records. experience them again fully is like watching a video recording. if they were selected to be present below, they important for current context`,
          ...eventsPart,
        ]
      : []),
    `## instruction reminder`,
    instruction,
    `## event to make memory from`,
    `${focusedEvent.name} ${focusedEvent.date.substring(0, 10)}`,
    focusedEvent.text,
    `## possible topics to make memory, irrelevant can be fully omitted`,
    topics.join("\n"),
  ].join("\n\n")
}
