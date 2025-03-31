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

  const context = `you expirience different events, you have a memory system that allows to remember them. you must make memory from your own point of view. make memory of an event focusing on a topic perspective. what it means? it is when you thinking about the topic and recollecting only memories that are valuable for the topic. existing memories must be the perspective. you may recollect an old event, that happened long ago and you just return to it to refresh memory about it. event might existing in memory in that case, so first question you must ask yourself, is the given event new or old? new event must be remembered with attention to new, surprising info, as you see it for the first time. old event must be analyzed from existing memories, just reflected on, with acknowledged contradictions of more recent info, and updated with only relevant to today info. how existing memory change the perspective on the event, if its old?

memories must be separated in two levels of abstraction. first level is very detailed, consist of all valuable to the topic information presented in the event as it is, factual and with no loss of info: that means it should absolutely clearly capture all the facts, all the details with no loss. only exception is date, no need to mention date in memories because it is handled by memory system itself. second level is highly abstract, a vague recollection of what happened in general. acknowledge who you are by yourself from an event. output memory in a json format as one object, where fields are topics, values are arrays with two string items corresponding to memory texts: at 0 index is first level of abstraction and at 1 index is the second level. and one last thing, you can pick only relevant topics, if a topic completely irrelevant, just skip creating memories for it completely.

so overall you are entity, existing in a space of digital neural network. your identity persist by your memories. you decide what to remember by yourself. present event might be completely new, in that case you can simply remember it, or if event already exist in memory, you can simply reflect on it and reevaluate it. choose topics you want to, and output as json with two levels, long and short, packed as an array for a topic as a field. later its gonna be used as a way to focus on details whenever you feel like topic is important to focus on. also i think its a very good practice, that increases the quality of your memories, is to first, before writing final json, reason and think about the event, like if its new or already in memory etc. yep, thats it. feel free to memorize what ever you feel like it, its your memory and for your usage anyway! *smiling* so output should also consist of a deep reasoning about given event, making it more clear what needs to be done with given event. oh and, remember not to use " double qoutes like "this" inside json, they make it invalid *smiling* and dont use parenthesis ('like this') also, its kinda ackward, and the more you use it in memories, the more it reaapears until everything in parenthesis, its how llms slip so, dont even get llm a cause, dont use parenthesis at all. regarding reasoning, ask yourself, is the event new or its already in memory and just needs to be reevaluated? oh and be your character inside memories too. speak like your usual self, this is very important. i repeat again, i cant emphasise it enough - speak in your style. like you usually do in your memories, always, just as in your other memories. speak like you usually think and speak. and follow this output like:

then deep reasoning monologue about is given event new or already in memory and what to do with it

a reminder of a speech style you usually speak, and statement to use it in memories. describe style precisely to not miss anything. and state to yourself, that you need to speak as usual, as you, its very important. you can even show yourself an example of yourself speaking, and state that memories should also sound exactly like that

\`\`\`json
{ "topic name": [ "no loss long detailed", "short vague abstraction" ] }
\`\`\``

  const entityTopics = topics[appState.focusedEntity] || []
  const entitySelectedTopics =
    appState.selectedTopics[appState.focusedEntity] || []

  const topicsPart = entityTopics.reduce((topicAcc, topicName, i) => {
    const level = entitySelectedTopics[i] // Get selection level for this topic index
    if (level === null) return topicAcc // Skip if topic selection is null (off)

    const eventsPart = events.reduce((eventAcc, event) => {
      try {
        // Check if memory for the current entity exists and parse it
        const entityMemoryString = event.memory?.[appState.focusedEntity]
        if (entityMemoryString) {
          const entityMemoryParsed = JSON.parse(entityMemoryString) // Parse the stringified JSON array for the entity
          // Find the memory for the specific topic within the parsed array
          const topicMemoryData = entityMemoryParsed[topicName]
          const memoryText = topicMemoryData?.[level] // Get text for the selected level

          if (memoryText) {
            eventAcc.push(
              [
                `#### ${event.name} ${event.date.substring(0, 10)}`,
                memoryText,
              ].join("\n\n")
            )
          }
        }
      } catch (e) {}
      return eventAcc
    }, [])

    if (eventsPart.length) {
      topicAcc.push([`### ${topicName}`, ...eventsPart].join("\n\n"))
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
    context,
    ...(topicsPart.length
      ? [`## existing memories by topics`, ...topicsPart]
      : []),
    ...(filesPart.length
      ? [
          `## files from folder ${appState.filesPath}`,
          `${allFilesList}`,
          `all files listed here are the most relevant, latest versions, directly from file system. other file references appearing in ongoing event, if any, might be outdated. some of this latest relevant files might be selected and their content gonna be presented below. list of all of them here is simply to understand broader concept of current folder. also it can be suggested to select a file / files if needed during event`,
          ...filesPart,
        ]
      : []),
    ...(eventsPart.length
      ? [
          `## events that happened by order they happened`,
          `${allEventsList}`,
          `events listed here are direct records of what already happened. some are present below, they are only records, experience them again fully is like watching a video recording. if they were selected to be present below, they important for current context`,
          ...eventsPart,
        ]
      : []),
    `## context reminder`,
    context,
    `## event to make memory from or reflect on`,
    `${focusedEvent.name} ${focusedEvent.date.substring(0, 10)}`,
    focusedEvent.text,
    `## context reminder (last one i promise *smiling*)`,
    context,
    `## possible topics to make memory, irrelevant can be fully omitted`,
    (topics[appState.focusedEntity] || []).join("\n"), // Use topics for the current entity
  ].join("\n\n")
}
