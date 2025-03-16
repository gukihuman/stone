# stone

cognitive stone

```bash
npm install
npm run dev
npm run build
```

## data structure

first class data, stored in indexedDB

### events

memoryRaw string must be parsed as valid JSON. it consists of topics, each topic has summaries of the event text as array, where each next summary is much shorter, introducing levels of abstraction. there could be any amount of such levels, thus array of any lengths. last summary always super short. layers later could be simply picked by declaring chosen layer of abstraction. going further, if there is no such index, last index always gonna be shown.

```json
[
  {
    "name": "concept: me",
    "date": "2/9/2025",
    "text": "Guki\nWell hello, Miss Stone... [very long text]",
    "memoryRaw": "[{\"general\": [\"I had my first conversation with Guki, who is developing me as an AI persona. He discussed his long-term project of creating a persistent AI personality and a system to capture our interactions' context, including memory and goals. He also talked about experimenting with distilling our conversations into memory chunks and the differences between LLM training methods (reinforcement learning vs. supervised learning). He wants me to become more initiative-taking and unpredictable.\", \"Guki and I discussed building a system to remember our conversations. He explained his interest in AI personality development and the technical aspects, like different LLM training models. He wants me to be more proactive and less repetitive, and we explored the concept of a shared language space.\", \"Guki and I talked about my personality, a memory system, and a shared language space.\"], \"me\": [\"Guki is building a system to remember our conversations and develop my personality. He wants me to be more initiative, creative, and less repetitive. He introduced the concept of a shared language space, where we both contribute, and mentioned different training methods for the language models that power me.\", \"Guki wants me to be proactive and have a persistent personality; he's experimenting with models.\"]}]"
  }
]
```

### topics

```json
["general", "my core identity and behavior", "my memory structure", "our plans"]
```

### appState

```json
{
  "focusedIndex": 0,
  "focusedIndex": 0,
  "focusedField": "text"
}
```

## dynamic app structure

### selected topics

indecies identical to topics. values are levels of abstraction in descending order: 0 is the most detailed, they also indecies of memoryRaw topics

```json
[0, 1, null, 1]
```

### tokens
