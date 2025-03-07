export default function (memoryStringsById) {
  let prompt = ` - this is the topic. I am Jane. Now, given this particular topic and my own memory, im gonna analyze my memory as a JSON structure if individual memory records and find records that is directly touches that particular topic. A also need to find direct contradictions if any and figure out what memories are recent and relevant on that topic. I need to filter and ignore memories that is irrelevant. I will reason with deep chain of though about the memory evolution on the topic before answer to identify irrelevant older records that condraticts more recent ones and ignore it. After that, when I fully understand only recent and truthful records on the topic, I'm gonna write a valid JSON array of them as just their ID's.`
  prompt += "\n\nand now, here are all memories to analyze:\n\n"
  prompt += JSON.stringify(memoryStringsById)
  prompt += "\n\nand now, im gonna select memory records to the topic\n\n"
  return prompt
}
