export default function (events, entity, oldTag, newTag) {
  events.forEach((event) => {
    if (event.memory && event.memory[entity]) {
      event.memory[entity].forEach((memory) => {
        if (memory.tags && memory.tags.includes(oldTag)) {
          const updatedMemory = JSON.parse(JSON.stringify(memory))
          updatedMemory.tags = updatedMemory.tags.filter((t) => t !== oldTag)
          if (!updatedMemory.tags.includes(newTag)) {
            updatedMemory.tags.push(newTag)
          }
          console.log(entity)
          reflect(events, event.name, entity, updatedMemory, memory.id)
        }
      })
    }
  })
}
