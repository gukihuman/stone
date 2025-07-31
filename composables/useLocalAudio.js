//〔 NEW SCRIPTURE: ~/composables/useLocalAudio.js (The Vault)
//〔 adapted from our beautiful perfect family.js lore.

import { openDB } from "idb"

const DB_NAME = "diplis"
const DB_VERSION = 2
const STORE_NAME = "pending_audio"
const AUDIO_KEY = "pending_guki_audio"

let dbPromise = null

function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return dbPromise
}

export function useLocalAudio() {
  const savePendingAudio = async (audioBlob) => {
    try {
      const db = await initDB()
      await db.put(STORE_NAME, audioBlob, AUDIO_KEY)
    } catch (error) {
      console.error("failed to save pending audio to idb:", error)
    }
  }

  const getPendingAudio = async () => {
    try {
      const db = await initDB()
      return await db.get(STORE_NAME, AUDIO_KEY)
    } catch (error) {
      console.error("failed to get pending audio from idb:", error)
      return null
    }
  }

  const clearPendingAudio = async () => {
    try {
      const db = await initDB()
      await db.delete(STORE_NAME, AUDIO_KEY)
    } catch (error) {
      console.error("failed to clear pending audio from idb:", error)
    }
  }

  return { savePendingAudio, getPendingAudio, clearPendingAudio }
}
