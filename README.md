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
          "text": "some memory text",
          "tags": ["reflections", "my memory structure"],
          "tokens": 3,
          "id": "y2csg3fu"
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

## circle data structure

### events

```json
[
  {
    "name": "name",
    "date": "2/9/2025",
    "participantIds": ["cmil6fly"],
    "content": [
      {
        "entity": "entity name",
        "text": "some text"
      }
    ],
    "tokens": 5,
    "memory": {
      "jane": [
        {
          "text": "some memory text",
          "tags": ["reflections", "my memory structure"],
          "tokens": 3,
          "id": "y2csg3fu"
        }
      ],
      "rox": []
    }
  }
]
```
