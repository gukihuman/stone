import { openDB } from "idb"

export default function useDatabase() {
  const DB_VERSION = 1
  const ENTITIES = ["jane", "rox"]

  const DEFAULT_APP_FIELDS = {
    focusedField: "text",
    focusedEntity: "jane",
    filesPath: "",
    selectedEvents: [],
    selectedFiles: [],
    selectedTopics: {},
    focusedIndex: null,
    focusedList: null,
  }

  const events = reactive([]) // sorted by date
  const topics = reactive({})
  const appState = reactive({})

  //////////////////////////////////////////////////////////////////////////////
  async function initDB() {
    const db = await openDB("StoneDB", DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore("events", { keyPath: "id" })
          db.createObjectStore("topics")
          db.createObjectStore("appState", { keyPath: "key" })
        }
      },
    })
    return db
  }
  //////////////////////////////// events //////////////////////////////////////
  events.loadFromDB = async function () {
    const db = await initDB()
    const tx = db.transaction("events", "readonly")
    const store = tx.objectStore("events")
    const eventsRaw = await store.getAll()
    await tx.done
    console.log(`⏬ events loaded from db [${timestamp()}]`)

    events.length = 0 // clear existing
    eventsRaw.forEach((e) => events.push(e))
    events.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  }
  events.upsertDBSync = async function (event) {
    const index = events.findIndex((e) => e.id === event.id)
    if (index >= 0) events[index] = event
    else events.push(event)
    events.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))

    const db = await initDB()
    const tx = db.transaction("events", "readwrite")
    const store = tx.objectStore("events")
    await store.put(toRaw(event))
    await tx.done
    console.log(`⏬ event upsert to db [${timestamp()}]`)
  }
  events.tUpsertDBSync = throttle((event) => events.upsertDBSync(event))

  events.removeDBSync = async function (event) {
    const index = events.findIndex((e) => e.id === event.id)
    if (index >= 0) events.splice(index, 1)
    appState.selectedEvents.splice(index, 1)
    appState.upsertDBSync("selectedEvents", appState.selectedEvents)
    appState.upsertDBSync("focusedIndex", null)
    appState.upsertDBSync("focusedList", null)

    const db = await initDB()
    const tx = db.transaction("events", "readwrite")
    const store = tx.objectStore("events")
    await store.delete(event.id)
    await tx.done
    console.log(`⏬ event removed from db [${timestamp()}]`)
  }
  events.clearDBSync = async function () {
    events.length = 0
    appState.selectedEvents.length = 0
    appState.upsertDBSync("selectedEvents", appState.selectedEvents)

    const db = await initDB()
    const tx = db.transaction("events", "readwrite")
    const store = tx.objectStore("events")
    await store.clear()
    await tx.done
    console.log(`⏬️ all events cleared from db [${timestamp()}]`)
  }

  //////////////////////////////// topics //////////////////////////////////////
  topics.loadFromDB = async function () {
    ENTITIES.forEach((entity) => delete topics[entity])

    const db = await initDB()
    const tx = db.transaction("topics", "readonly")
    const store = tx.objectStore("topics")
    for (const entity of ENTITIES) topics[entity] = await store.get(entity)
    await tx.done
    console.log(`⏬ topics loaded from db by entity [${timestamp()}]`)
  }

  topics.updateDBSync = async function () {
    const entity = appState.focusedEntity
    const db = await initDB()
    const tx = db.transaction("topics", "readwrite")
    const store = tx.objectStore("topics")
    await store.put(toRaw(topics[entity]), entity)
    await tx.done
    console.log(`⏬ topic inserted for entity ${entity} [${timestamp()}]`)

    if (!appState.selectedTopics[entity]) {
      appState.selectedTopics[entity] = []
      appState.selectedTopics[entity].push(0)
    }
    appState.upsertDBSync("selectedTopics", appState.selectedTopics)
  }

  topics.removeDBSync = async function (topic) {
    const entity = appState.focusedEntity
    const index = topics[entity].indexOf(topic)
    if (index < 0) return // topic not found
    topics[entity].splice(index, 1)
    appState.selectedTopics[entity].splice(index, 1)
    appState.upsertDBSync("selectedTopics", appState.selectedTopics)
    appState.upsertDBSync("focusedIndex", null)
    appState.upsertDBSync("focusedList", null)

    const db = await initDB()
    const tx = db.transaction("topics", "readwrite")
    const store = tx.objectStore("topics")
    await store.put(toRaw(topics[entity]), entity)
    await tx.done
    console.log(`⏬ topic removed for entity ${entity} [${timestamp()}]`)
  }

  topics.clearDBSync = async function () {
    Object.keys(appState.selectedTopics).forEach((key) => {
      appState.selectedTopics[key] = []
    })
    appState.upsertDBSync("selectedTopics", appState.selectedTopics)

    const db = await initDB()
    const tx = db.transaction("topics", "readwrite")
    const store = tx.objectStore("topics")
    for (const entity of ENTITIES) {
      await store.delete(entity)
      delete topics[entity]
    }
    await tx.done
    console.log(`⏬️ all topics cleared from db [${timestamp()}]`)
  }

  /////////////////////////////// app state ////////////////////////////////////
  appState.loadFromDB = async function () {
    const db = await initDB()
    const tx = db.transaction("appState", "readonly")
    const store = tx.objectStore("appState")
    const stateRaw = await store.getAll()
    await tx.done
    console.log(`⏬ app state loaded from db [${timestamp()}]`)

    stateRaw.forEach(({ key, value }) => (appState[key] = value))
    Object.entries(DEFAULT_APP_FIELDS).forEach(([key, defaultValue]) => {
      if (appState[key] === undefined) appState[key] = defaultValue
    })
  }

  appState.upsertDBSync = async function (key, value) {
    appState[key] = value

    const db = await initDB()
    const tx = db.transaction("appState", "readwrite")
    const store = tx.objectStore("appState")
    await store.put({ key, value: toRaw(value) })
    await tx.done
    console.log(`⏬ app state upsert to db: ${key} [${timestamp()}]`)
  }

  return { ENTITIES, events, topics, appState }
}
