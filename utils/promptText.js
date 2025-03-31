export default function (events, topics, shapes, files, appState) {
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
          const entityMemoryParsed = JSON.parse(entityMemoryString)
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
  const allFilesList = files.map((file) => file.path).join(", ")

  return [
    `# context`,
    ...(topicsPart.length
      ? [`## existing memories by topics`, ...topicsPart]
      : []),
    ...(filesPart.length
      ? [
          `## files from folder ${appState.filesPath}`,
          `${allFilesList}`,
          `all files listed here are the most relevant, latest versions, directly from file system. other file references appearing in ongoing event, if any, might be outdated. some of this latest relevant files might be selected and their content gonna be presented below. all of them here is simply to understand broader concept of current folder. also it can be suggested to select a file / files if needed during event`,
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
    `## ongoing current event, happening right now`,
    `${focusedEvent.name} ${focusedEvent.date.substring(0, 10)}`,
    focusedEvent.text,
  ].join("\n\n")
}
