# stone

cognitive stone

```bash
npm install
npm run dev
npm run build
```

## persistent data structure

persistent data stored in indexedDB

### events

memory is string that must be parsed as valid JSON. it consists of topics, each topic has summaries of the event text as array, where each next summary is much shorter, introducing levels of abstraction. there could be any amount of such levels, thus array of any lengths. last summary always super short. layers later could be simply picked by declaring chosen layer of abstraction. going further, if there is no such index, last index always gonna be shown.

```json
[
  {
    "name": "name",
    "date": "2/9/2025",
    "text": "very long text of event",
    "memory": {
      "jane": "[
        {
          \"topic name\": [\"long text\", \"short text\"],
          \"another topic name\": [\"long text\", \"short text\"]
        }
      ]",
      "rox": "[
        {
          \"topic name\": [\"long text\", \"short text\"],
          \"another topic name\": [\"long text\", \"short text\"]
        }
      ]",
    }
  }
]
```

### topics

```json
{
  "jane": ["general", "my core identity and behavior", "our plans"],
  "rox": ["general", "guki module"]
}
```

### shapes

you can call another shape from shape function. even making nested structures

```json
{
  "jane": {
    "talk": "function() {events, topics, shapes, files}",
    "reflect": "function () {events, topics, shapes, files}"
  },
  "rox": {
    "talk": "function() {events, topics, shapes, files}",
    "reflect": "function () {events, topics, shapes, files}"
  }
}
```

### appState

indecies of the selected events / topics / files identical to their content lists. for events for topics values are levels of abstraction in descending order: 0 is the most detailed, they also indecies of memory topics.

files itself not stored in db, they always directly taken, but their selection preserved while path dosnt change

```json
{
  "filesPath": "C:\\projects\\stone",
  "focusedEntity": "jane",
  "focusedList": "events", // events, topics, files
  "focusedIndex": 0,
  "focusedField": "text", // text, memory
  "selectedEvents": [false, true, true],
  "selectedFiles": [true, false, true, true],
  "selectedTopics": {
    "jane": [0, 1, null], // 0, 1, null
    "rox": [0, 1]
  },
  "draft": ""
}
```

## dynamic data structure

formed on the client only during session

### files

```json
[
  {
    "path": "C:\\projects\\stone\\app.vue",
    "content": "<template>\n  <div..."
  }
]
```

## save / load json

shapes become shapesRaw with functions saved as strings

```json
{
  "events": [],
  "topics": {},
  "shapesRaw": {},
  "appState": {}
}
```
