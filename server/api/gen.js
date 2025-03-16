import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage } from "@langchain/core/messages"

export default defineEventHandler(async (event) => {
  const { input, model } = await readBody(event)
  const llmModel = new ChatGoogleGenerativeAI({
    model,
    temperature: 1,
    apiKey: process.env.GEMINI_API_KEY,
  })
  const messages = [new HumanMessage({ content: input })]

  event.node.res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  })
  try {
    const stream = await Promise.race([
      llmModel.stream(messages),
      new Promise((_, reject) => setTimeout(() => reject(new Error("")), 8000)),
    ])
    for await (const chunk of stream) event.node.res.write(chunk.content)
  } catch (error) {
    event.node.res.write(`ERROR: ${error.message}`)
  }
  event.node.res.end()
})
