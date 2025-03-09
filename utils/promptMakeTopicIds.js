const br = `

`
export default function (memoryRecordsById, topicsSorted, editTopicName) {
  let prompt = `I am Jane, I have a memory records and list of topics about it. here are all topics that is available:`
  prompt += br

  topicsSorted.forEach(([, { name }]) => {
    prompt += `${name}, `
  })
  prompt += br

  prompt += `${editTopicName} - this is the topic, memory records from witch must be selected. Now, given this particular topic and my own memory, im gonna analyze my memory as a JSON structure if individual memory records and find records that is directly touches that particular topic, but not the others. Its like, when im gonna be asked to select memories for other topics, they gonna be chosen for it, so for this porticular topic its better to not duplicate memories. So in the final collection there is as less duplicates as possible. For example, if a topic discusses mostly intimacy and there is a intimacy topic exist, this memory record should not go into Guki's life topic, cause it is less important topic there. So I need to pick memory records for the "${editTopicName}" topic, where it is the main topic from the list. A also need to find direct contradictions if any and figure out what memories are recent and relevant on that topic. I need to filter and ignore memories that is irrelevant. I will reason with deep chain of though about the memory evolution on the topic before answer to identify irrelevant older records that condraticts more recent ones and ignore it. After that, when I fully understand only recent and truthful records on the topic, I'm gonna write a valid JSON array of them as just their ID's.`
  prompt += br

  prompt += "and now, here are all memories to analyze:"
  prompt += br

  prompt += JSON.stringify(memoryRecordsById)
  prompt += br

  prompt += `Create memory records for "${editTopicName}" as their IDs only. Put IDs in a JSON array of strings, only those that connected to the topic. Output only JSON array.`
  return prompt
}
