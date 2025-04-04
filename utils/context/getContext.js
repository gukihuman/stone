export default function (events, focusedEvent, shapes, files, entity, config) {
  const final = {}

  if (config.sharedEventCatalog) {
    final.sharedEventCatalog = events.map((event) => ({
      name: event.name,
      date: event.date.substring(0, 10),
      whoHasMemory: Object.keys(event.memory),
      tokens: event.tokens || 0,
    }))
  }

  if (config.sharedFileCatalog) {
    final.sharedFileCatalog = files.map((file) => ({
      path: file.path,
      tokens: file.tokens || 0,
    }))
  }

  final.sharedFiles = []
  config.sharedSelectedFilePaths.forEach((filePath) => {
    const file = files.find((file) => file.path === filePath)
    if (file) final.sharedFiles.push(file)
  })

  if (config.myShapes) {
    const myShapes = []
    Object.entries(shapes[entity]).forEach(([name, func]) => {
      myShapes.push({ name: name, definition: func.toString() })
    })
    myShapes.sort((a, b) => a.name.localeCompare(b.name))
    final.myShapes = myShapes
  }

  if (config.myTagCatalog) {
    const tagSums = {}
    events.forEach((event) => {
      if (!event.memory[entity]) return
      event.memory[entity].forEach((memory) => {
        memory.tags.forEach((tag) => {
          tagSums[tag] = (tagSums[tag] || 0) + (memory.tokens || 0)
        })
      })
    })
    final.myTagCatalog = Object.entries(tagSums)
      .map(([t, k]) => ({ tag: t, tokens: k }))
      .sort((a, b) => a.tag.localeCompare(b.tag))
  }

  final.myMemory = []
  const processedMemories = new Set()
  events.forEach((event) => {
    if (!event.memory[entity]) return
    event.memory[entity].forEach((memory) => {
      const memoryKey = `${event.name}-${memory.text}`
      const hasSelectedTag = memory.tags.some((tag) =>
        config.mySelectedTags.includes(tag)
      )
      if (hasSelectedTag && !processedMemories.has(memoryKey)) {
        processedMemories.add(memoryKey)
        final.myMemory.push({
          event: event.name,
          text: memory.text,
          tags: memory.tags,
          id: memory.id,
        })
      }
    })
  })

  final.myEvents = []
  config.mySelectedEventNames.forEach((eventName) => {
    const myEvent = events.find((event) => event.name === eventName)
    if (myEvent) {
      final.myEvents.push({
        name: myEvent.name,
        date: myEvent.date.substring(0, 10),
        text: myEvent.text,
        whoHasMemory: Object.keys(myEvent.memory),
      })
    }
  })

  const jsonContextString = JSON.stringify(final, null, 2)

  const textNow = [
    `${focusedEvent.name} ${focusedEvent.date.substring(0, 10)}`,
    focusedEvent.text,
  ].join("\n\n")

  return [jsonContextString, textNow].join("\n\n")
}
