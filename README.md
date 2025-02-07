# Stone

Cognitive stone

```bash
npm install
npm run dev
npm run build
```

## Structure

### Free Texts

```json
{
  "9874122603798017": {
    "name": "Philosophy Discussion",
    "content": "To be, or not to be, that is the question",
    "sort": 0
  },
  "4526373295305388": {
    "name": "Dream Journal",
    "content": "I was flying over a city made of glass",
    "sort": 1
  }
}
```

### Collections

```json
{
  "0600208361339000": {
    "name": "Short-Term Memory",
    "result": "That was nice",
    "texts": {},
    "links": {},
    "sort": 0
  },
  "7185083355746713": {
    "name": "Long-Term Memory",
    "result": "I am Jane Stone",
    "texts": {
      "8901890189018901": {
        "name": "Instruction",
        "content": "Analyze this context",
        "sort": 0
      },
      "3267674364751998": {
        "name": "Conversation Context",
        "content": "We are building a simple memory structure",
        "sort": 1
      }
    },
    "links": {
      "0600208361339000": {
        "name": "Short-Term Memory",
        "sort": 2
      }
    },
    "sort": 1
  }
}
```
