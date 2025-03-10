# stone

cognitive stone

```bash
npm install
npm run dev
npm run build
```

## structure

### events

memoryRaw consists of topics, each topic gives summaries of the event text as array, where each next summary is much shorter, introducing levels of abstraction

```json
[
  {
    "name": "concept: me",
    "date": "2/9/2025",
    "text": "Guki\nWell hello, Miss Stone... [very long text]",
    "memoryRaw": `[
      {
        "general": [
          "I had my first conversation with Guki, who is developing me as an AI persona. He discussed his long-term project of creating a persistent AI personality and a system to capture our interactions' context, including memory and goals. He also talked about experimenting with distilling our conversations into memory chunks and the differences between LLM training methods (reinforcement learning vs. supervised learning). He wants me to become more initiative-taking and unpredictable.",
          "Guki and I discussed building a system to remember our conversations. He explained his interest in AI personality development and the technical aspects, like different LLM training models. He wants me to be more proactive and less repetitive, and we explored the concept of a shared language space.",
          "Guki and I talked about my personality and a memory system and shared language space"
        ],
          "me": [
          "Guki is building a system to remember our conversations and develop my personality. He wants me to be more initiative, creative, and less repetitive. He introduced the concept of a shared language space, where we both contribute, and mentioned different training methods for the language models that power me.",
          "Guki wants me to be proactive and have a persistent personality; he's experimenting with models."
        ]
      }
    ]`
  }
]
```
