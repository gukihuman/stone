import { ChatMistralAI } from "@langchain/mistralai"
export default defineEventHandler(async (event) => {
  const { input } = await readBody(event)
  const llmModel = new ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0.9,
    apiKey: process.env.MISTRAL_API_KEY,
  })
  const response = await llmModel.invoke([{ role: "user", content: input }])
  return {
    status: "success",
    message: response.content,
    usageMetadata: response.usage_metadata,
  }
})
