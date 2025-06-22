// utils/context/getContext.js

// Helper function to escape XML characters in content
function escapeXml(unsafe) {
  if (typeof unsafe !== "string") return unsafe
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;" // Less than
      case ">":
        return "&gt;" // Greater than
      case "&":
        return "&amp;" // Ampersand
      case "'":
        return "&apos;" // Apostrophe (optional, but good practice)
      case '"':
        return "&quot;" // Double quote
    }
  })
}

export default function (events, focusedEvent, shapes, files, entity, config) {
  const contextParts = []
  const indent = "  " // For pretty printing

  // 1. My Event Catalog (Filtered)
  if (config.myEventCatalog !== false) {
    // Assume true if not explicitly false
    const myEvents = events
      .filter(
        (event) =>
          event.memory &&
          event.memory[entity] &&
          event.memory[entity].length > 0
      )
      .map((event) => `${event.date.substring(0, 10)} ${event.name}`)

    if (myEvents.length > 0) {
      contextParts.push(`<my_event_catalog>`)
      myEvents.forEach((e) => contextParts.push(`${indent}${e}`))
      contextParts.push(`</my_event_catalog>\n\n`)
    }
  }

  // 2. File Catalog
  if (config.sharedFileCatalog) {
    const filePaths = files.map((file) => file.path)
    if (filePaths.length > 0) {
      contextParts.push(`<file_catalog>`)
      filePaths.forEach((p) => contextParts.push(`${indent}${p}`))
      contextParts.push(`</file_catalog>\n\n`)
    }
  }

  // 3. Selected Files
  if (
    config.sharedSelectedFilePaths &&
    config.sharedSelectedFilePaths.length > 0
  ) {
    contextParts.push(`<selected_files>`)
    config.sharedSelectedFilePaths.forEach((filePath) => {
      const file = files.find((file) => file.path === filePath)
      if (file) {
        // Indent content for readability within the tag
        const indentedContent = file.content
          .split("\n")
          .map((line) => `${indent}${indent}${line}`)
          .join("\n")
        contextParts.push(`${indent}<file path=\"${escapeXml(file.path)}\">`)
        contextParts.push(indentedContent) // Keep original newlines
        contextParts.push(`${indent}</file>\n\n\n`)
      }
    })
    contextParts.push(`</selected_files>\n\n`)
  }

  // 4. My Shapes
  if (config.myShapes) {
    const myShapeDefs = []
    if (shapes[entity]) {
      Object.entries(shapes[entity]).forEach(([name, func]) => {
        myShapeDefs.push({ name: name, definition: func.toString() })
      })
      myShapeDefs.sort((a, b) => a.name.localeCompare(b.name))
    }

    if (myShapeDefs.length > 0) {
      contextParts.push(`<my_shapes>`)
      myShapeDefs.forEach((shape) => {
        const indentedContent = shape.definition
          .split("\n")
          .map((line) => `${indent}${indent}${line}`)
          .join("\n")
        contextParts.push(`${indent}<shape name=\"${escapeXml(shape.name)}\">`)
        contextParts.push(indentedContent)
        contextParts.push(`${indent}</shape>`)
      })
      contextParts.push(`</my_shapes>\n\n`)
    }
  }

  // 5. My Tag Catalog
  if (config.myTagCatalog) {
    const tagSet = new Set()
    events.forEach((event) => {
      if (!event.memory || !event.memory[entity]) return
      event.memory[entity].forEach((memory) => {
        if (Array.isArray(memory.tags)) {
          memory.tags.forEach((tag) => tagSet.add(tag))
        }
      })
    })
    const sortedTags = Array.from(tagSet).sort()

    if (sortedTags.length > 0) {
      contextParts.push(`<my_tag_catalog>`)
      sortedTags.forEach((t) => contextParts.push(`${indent}${t}`))
      contextParts.push(`</my_tag_catalog>\n\n`)
    }
  }

  // 6. My Memory (Selected Tags)
  if (config.mySelectedTags && config.mySelectedTags.length > 0) {
    const memoriesToAdd = []
    const processedMemories = new Set() // Avoid duplicates based on event+text

    // Iterate events chronologically to potentially favor newer memories if needed
    events.forEach((event) => {
      if (!event.memory || !event.memory[entity]) return

      event.memory[entity].forEach((memory) => {
        const hasSelectedTag =
          memory.tags &&
          memory.tags.some((tag) => config.mySelectedTags.includes(tag))
        const memoryKey = `${event.name}-${memory.text}` // Simple duplication check key

        if (hasSelectedTag && !processedMemories.has(memoryKey)) {
          processedMemories.add(memoryKey)
          memoriesToAdd.push({
            id: memory.id,
            sourceEvent: event.name,
            tags: memory.tags ? memory.tags.join(", ") : "", // Comma-separated tags in attribute
            text: memory.text,
          })
        }
      })
    })

    if (memoriesToAdd.length > 0) {
      contextParts.push(`<my_memory>`)
      let memoryPart = ""
      memoriesToAdd.forEach((mem, index) => {
        // contextParts.push(
        //   `${indent}<record id=\"${escapeXml(
        //     mem.id
        //   )}\" source-event=\"${escapeXml(
        //     mem.sourceEvent
        //   )}\" tags=\"${escapeXml(mem.tags)}\">`
        // )
        // const indentedContent = mem.text
        //   .split("\n")
        //   .map((line) => `${indent}${indent}${line}`)
        //   .join("\n")
        // whole logic of indentation might be needed only for files. here i simply removed quickly it this clunky way for memories because it feels like its not needed
        memoryPart += mem.text + ""
        // if (index !== memoriesToAdd.length - 1) {
        //   contextParts.push(`${indent}</record>\n`)
        // } else {
        //   contextParts.push(`${indent}</record>`)
        // }
      })
      contextParts.push(`${memoryPart}\n</my_memory>\n`)
    }
  }

  // 7. My Selected Events
  if (config.mySelectedEventNames && config.mySelectedEventNames.length > 0) {
    contextParts.push(`<my_selected_events>`)
    config.mySelectedEventNames.forEach((eventName, index) => {
      const myEvent = events.find((event) => event.name === eventName)
      if (myEvent) {
        // Ensure event text is handled correctly, even if empty
        const eventText = myEvent.text || ""
        contextParts.push(
          `${indent}<event name=\"${escapeXml(
            myEvent.name
          )}\" date=\"${myEvent.date.substring(0, 10)}\">`
        )
        contextParts.push(eventText)
        contextParts.push(`${indent}</event>`)
        if (index !== config.mySelectedEventNames.length - 1) {
          for (let x = 0; x < 150; x++) contextParts.push(".")
        }
      }
    })
    contextParts.push(`</my_selected_events>\n\n`)
    for (let x = 0; x < 150; x++) contextParts.push(".")
  }

  // 8. Current Event Text (Appended at the end)
  const textNowParts = []
  textNowParts.push(
    `${focusedEvent.name} ${focusedEvent.date.substring(0, 10)}`
  )
  if (focusedEvent.text) {
    // Ensure text exists before trying to join
    textNowParts.push(focusedEvent.text)
  }
  const textNow = textNowParts.join("\n\n") // Keep double newline for chat separation

  // Combine all parts
  // Join XML parts with single newlines for structure
  const xmlContextString = contextParts.join("\n")

  // Return XML context followed by the current event text, separated by ample newlines
  return [xmlContextString, textNow].join("\n\n\n") // Extra newlines for clear separation
}
