import { openDB } from "idb"

export default function useDatabase() {
  const DB_NAME = "StoneDB"
  const DB_VERSION = 1
  const STORE_EVENTS_NAME = "events"
  const STORE_APP_STATE_NAME = "appState"

  const events = reactive([]) // sorted by date
  const appState = reactive({})

  async function initDB() {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_EVENTS_NAME)) {
          db.createObjectStore(STORE_EVENTS_NAME, { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains(STORE_APP_STATE_NAME)) {
          db.createObjectStore(STORE_APP_STATE_NAME, { keyPath: "key" })
        }
      },
    })
    return db
  }

  events.loadFromDB = async function () {
    const db = await initDB()
    const tx = db.transaction(STORE_EVENTS_NAME, "readonly")
    const store = tx.objectStore(STORE_EVENTS_NAME)
    const eventsRaw = await store.getAll()
    await tx.done
    events.length = 0 // clear existing
    eventsRaw.forEach((e) => events.push(e))
    events.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    console.log(`⏬ events loaded from db [${timestamp()}]`)
  }
  events.upsertDBSync = async function (event) {
    const db = await initDB()
    const tx = db.transaction(STORE_EVENTS_NAME, "readwrite")
    const store = tx.objectStore(STORE_EVENTS_NAME)
    await store.put(toRaw(event))
    await tx.done
    const index = events.findIndex((e) => e.id === event.id)
    if (index >= 0) events[index] = event
    else events.push(event)
    events.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    console.log(`⏬ event upsert to db [${timestamp()}]`)
  }
  events.removeDBSync = async function (eventId) {
    const db = await initDB()
    const tx = db.transaction(STORE_EVENTS_NAME, "readwrite")
    const store = tx.objectStore(STORE_EVENTS_NAME)
    await store.delete(eventId)
    await tx.done
    const index = events.findIndex((e) => e.id === eventId)
    if (index >= 0) events.splice(index, 1)
    console.log(`⏬ event removed from db [${timestamp()}]`)
  }

  appState.loadFromDB = async function () {
    const db = await initDB()
    const tx = db.transaction(STORE_APP_STATE_NAME, "readonly")
    const store = tx.objectStore(STORE_APP_STATE_NAME)
    const stateRaw = await store.getAll()
    await tx.done
    stateRaw.forEach(({ key, value }) => (appState[key] = value))
    console.log(`⏬ app state loaded from db [${timestamp()}]`)
  }
  appState.upsertDBSync = async function (key, value) {
    const db = await initDB()
    const tx = db.transaction(STORE_APP_STATE_NAME, "readwrite")
    const store = tx.objectStore(STORE_APP_STATE_NAME)
    await store.put({ key, value })
    await tx.done
    appState[key] = value
    console.log(`⏬ app state upsert to db: ${key} [${timestamp()}]`)
  }

  return { events, appState }
}
