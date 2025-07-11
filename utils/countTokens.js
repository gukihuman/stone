// ~/utils/countTokens.js
import { encode } from "gpt-tokenizer"

export default function (string) {
  try {
    return encode(string).length
  } catch (e) {
    console.error("❗ error counting tokens")
  }
}
