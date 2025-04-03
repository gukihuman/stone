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

### shapes

you can call another shape from shape function. even making nested structures

```json
{
  "jane": { "logEventCount": "", "getContextConfig": "" },
  "rox": {}
}
```

### appState

files itself not stored in db, they always directly taken from system

```json
{
  "filesPath": "C:\\projects\\stone",
  "focusedEntity": "jane",
  "focusedList": "events", // events, tags, files
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
  "shapes": {},
  "appState": {}
}
```
