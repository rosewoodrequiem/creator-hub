import type { StateStorage } from "zustand/middleware"

const DB_NAME = "schedule-maker"
const STORE_NAME = "config"
const DB_VERSION = 1

export class IndexedDBStorage implements StateStorage {
  private dbPromise: Promise<IDBDatabase>
  private fallbackStorage: StateStorage

  constructor() {
    this.dbPromise = this.initDB()
    this.fallbackStorage = localStorage
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.warn("Failed to open IndexedDB, falling back to localStorage")
        reject(new Error("IndexedDB access denied"))
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    })
  }

  getItem<T>(key: string): Promise<T | null> {
    return this.dbPromise
      .then(
        (db) =>
          new Promise<T | null>((resolve) => {
            try {
              const transaction = db.transaction(STORE_NAME, "readonly")
              const store = transaction.objectStore(STORE_NAME)
              const request = store.get(key)

              request.onerror = () => {
                console.warn(
                  `IndexedDB get failed for key "${key}", using localStorage`,
                )
                const item = this.fallbackStorage.getItem(key) as string | null
                resolve(item ? JSON.parse(item) : null)
              }

              request.onsuccess = () => {
                resolve(request.result || null)
              }
            } catch (error) {
              console.warn(`IndexedDB error for key "${key}"`, error)
              const item = this.fallbackStorage.getItem(key) as string | null
              resolve(item ? JSON.parse(item) : null)
            }
          }),
      )
      .catch((error) => {
        console.warn("IndexedDB access failed, using localStorage", error)
        const item = this.fallbackStorage.getItem(key) as string | null
        return item ? JSON.parse(item) : null
      })
  }

  setItem<T>(key: string, value: T): Promise<void> {
    return this.dbPromise
      .then(
        (db) =>
          new Promise<void>((resolve) => {
            try {
              const transaction = db.transaction(STORE_NAME, "readwrite")
              const store = transaction.objectStore(STORE_NAME)
              const request = store.put(value, key)

              request.onerror = () => {
                console.warn(
                  `IndexedDB set failed for key "${key}", using localStorage`,
                )
                this.fallbackStorage.setItem(key, JSON.stringify(value))
                resolve()
              }

              request.onsuccess = () => {
                resolve()
              }
            } catch (error) {
              console.warn(`IndexedDB error for key "${key}"`, error)
              this.fallbackStorage.setItem(key, JSON.stringify(value))
              resolve()
            }
          }),
      )
      .catch((error) => {
        console.warn("IndexedDB access failed, using localStorage", error)
        this.fallbackStorage.setItem(key, JSON.stringify(value))
      })
  }

  removeItem(key: string): Promise<void> {
    return this.dbPromise
      .then(
        (db) =>
          new Promise<void>((resolve) => {
            try {
              const transaction = db.transaction(STORE_NAME, "readwrite")
              const store = transaction.objectStore(STORE_NAME)
              const request = store.delete(key)

              request.onerror = () => {
                console.warn(
                  `IndexedDB delete failed for key "${key}", using localStorage`,
                )
                this.fallbackStorage.removeItem(key)
                resolve()
              }

              request.onsuccess = () => {
                resolve()
              }
            } catch (error) {
              console.warn(`IndexedDB error for key "${key}"`, error)
              this.fallbackStorage.removeItem(key)
              resolve()
            }
          }),
      )
      .catch((error) => {
        console.warn("IndexedDB access failed, using localStorage", error)
        this.fallbackStorage.removeItem(key)
      })
  }
}
