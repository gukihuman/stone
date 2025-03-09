import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage } from "@langchain/core/messages"

export default defineEventHandler(async (event, json) => {
  const { input } = await readBody(event)
  const llmModel = new ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0.9,
    apiKey: process.env.MISTRAL_API_KEY,
  })
  const messages = [new HumanMessage({ content: input })]

  event.node.res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  })
  const stream = await llmModel.stream(messages)
  for await (const chunk of stream) event.node.res.write(chunk.content)
  event.node.res.end()
})
