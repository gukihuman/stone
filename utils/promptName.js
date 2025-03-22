export default function (events, topics, files, appState) {
  const focusedEvent = events[appState.focusedIndex]
  const instruction = `your task is to name a given event. existing memories are for context only. name the text presented as given event. name should be lowercase, no special symbols, even commas, and most importantly short. use existing even names as reference. deeply reason about names first, then provide a json as an array with one string item. so the output is like:
  
  deep reasoning monologue text
  ["final name"]`

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
  const allFilesList = files.map((file) => file.path).join(", ")

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
    [`## event to name `, focusedEvent.date.substring(0, 10)].join(`\n\n`),
    focusedEvent.text,
  ].join(`\n\n`)
}
