import { generate } from "random-words"
export default function () {
  return generate({ exactly: 1, wordsPerString: 2, maxLength: 6 })[0]
}
