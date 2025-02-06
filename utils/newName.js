import { generate } from "random-words"
export default () => {
  return generate({ exactly: 1, wordsPerString: 2, maxLength: 6 })[0]
}
