# stone

cognitive stone

```bash
npm install
npm run dev
npm run build
```

## structure

### memoryStringsById

This is the main memory storage, where memories are stored and identified by ID. Each time the input changes, memories are parsed from the event's memoryStringsRaw. A new ID is assigned with every change, as memories can be significantly updated or completely replaced. The event also stores memoryIds solely to remove previous memories when the input changes. After removal, memoryIds is updated with the newly assigned IDs for future removals. While this involves frequent removals even for small changes, it's acceptable because the input is often a copy-paste of a completely new set of memories.

```json
{
  "0214702358321752": "to be",
  "1752890679257238": "not to be",
  "4527307323225730": "flying",
  "7252124575123408": "city made of glass"
}
```

### eventsById

```json
{
  "9874122603798017": {
    "sort": 0,
    "name": "Philosophy Discussion",
    "time": "2025-02-14",
    "text": "To be, or not to be, that is the question",
    "memory": "['to be', 'not to be']",
    "memoryIds": [0214702358321752, 1752890679257238]
  },
  "4526373295305388": {
    "sort": 1,
    "name": "Dream Journal",
    "time": "2025-02-14",
    "text": "I was flying over a city made of glass",
    "memory": "['flying', 'city made of glass']",
    "memoryIds": [4527307323225730, 7252124575123408]
  }
}
```

### topicsById

```json
{
  "9874122603798017": {
    "sort": 0,
    "name": "Philosophy",
    "memoryIdsRaw": "[0214702358321752, 1752890679257238]",
    "memoryIds": [0214702358321752, 1752890679257238],
    "selected": true
  }
}
```
