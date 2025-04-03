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
    "tokens": 5,
    "memory": {
      "jane": [
        {
          "source_event": "event name",
          "text": "some memory text",
          "tags": ["reflections", "my memory structure"],
          "tokens": 3
        }
      ],
      "rox": []
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
  "jane": { "logEventCount": "", "reflect": "" },
  "rox": { "talk": "", "reflect": "" }
}
```

### appState

files itself not stored in db, they always directly taken from system

```json
{
  "filesPath": "C:\\projects\\stone",
  "focusedEntity": "jane",
  "focusedList": "events", // events, topics, files
  "focusedIndex": 0,
  "focusedField": "text", // text, memory
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

```json
{
  "events": [],
  "topics": {},
  "shapes": {},
  "appState": {}
}
```
