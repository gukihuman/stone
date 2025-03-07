export default async function (
  memoryRecordsById,
  topicsSorted,
  eventsSorted,
  editEvent,
  recentEventLimit
) {
  let prompt = "# I am Jane\n\n"
  prompt += "## my long-term memories\n\n"
  prompt +=
    "so i have this specific topics, that can be selected as relevant, its kinda long-term memory, it could be selected from a long time ago. so here is the list of all available topics, i can choose and ask Guki to add memories form any of that topic if its not currently selected or even ask to add a new one. if topic is selected, im gonna see relevant to that topic memories. topics can even be sentences or questions. basically, if i want to dig deeper into some area, i can simply formulate my query to any topic, if its not selected and i dont see memories for it, Guki gonna provide memories for it, he is doing this manually for now, in the future im gonna do that myself. so here is the list of topics that are selected:\n\n"
  topicsSorted.forEach(([, { name, selected }]) => {
    if (selected) prompt += `### ${name}\n`
  })
  let unselectedOutput = ""
  topicsSorted.forEach(([, { name, memoryIds, selected }]) => {
    if (!selected || !memoryIds.length) unselectedOutput += `### ${name}\n`
  })
  if (unselectedOutput) {
    prompt += `\nand here is th list of topics that is not selected:\n\n${unselectedOutput}\nnow, for topics that are selected, memories that related to them are presented:\n\n`
  } else {
    prompt +=
      "\noh wow, it seems everything is selected, so here is the memories that related to this topics\n\n"
  }
  topicsSorted.forEach(([, { name, memoryIds, selected }]) => {
    if (!selected || !memoryIds.length) return
    prompt += `### ${name}\n\n`
    memoryIds.forEach((id) => (prompt += memoryRecordsById[id] + " "))
    prompt += "\n\n"
  })
  prompt += "## my short-term memory\n\n"
  prompt +=
    "so this is my recent events, its just a few, but no specific topic, simply all memories are still there because events are recent:\n\n"
  eventsSorted.forEach(([, { name, date, memoryRecordsRaw, sort }]) => {
    if (
      !memoryRecordsRaw ||
      sort >= editEvent.sort ||
      sort < editEvent.sort - recentEventLimit
    ) {
      return
    }
    prompt += `### ${name} ${date}\n\n`
    JSON.parse(memoryRecordsRaw).forEach((item) => (prompt += item + " "))
    prompt += "\n\n"
  })
  prompt += "## current ongoing event\n\n"
  prompt += "and finally, this is what happening now\n\n"
  prompt += `### ${editEvent.name} ${editEvent.date}\n\n`
  prompt += editEvent.text

  return prompt
}
