import { StateStorage } from "zustand/middleware"
import Dexie from "dexie"
import { isPlainObject } from "lodash"
import { ConfigState } from "./useConfig.types"
import { deepMapStringsAsync, deepForEachString } from "../utils/object"

const DB_NAME = "schedule-maker"
const CONFIG_KEY = "schedule-maker-config"

type PersistEnvelope = {
  state: ConfigState
  version: number
}

class ImageDB extends Dexie {
  images!: Dexie.Table<{ id: string; data: string }, string>
  constructor() {
    super(DB_NAME)
    this.version(1).stores({ images: "id" })
  }
}

const isEnvelope = (v: unknown): v is PersistEnvelope =>
  isPlainObject(v) && "state" in (v as any) && "version" in (v as any)

export class HybridStorage implements StateStorage {
  private db = new ImageDB()

  private async loadImage(idOrUrl?: string): Promise<string | undefined> {
    if (!idOrUrl || !idOrUrl.startsWith("id:")) return idOrUrl
    const id = idOrUrl.slice(3)
    const image = await this.db.images.get(id)
    return image?.data
  }

  async getItem(name: string): Promise<string | null> {
    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name)
      return null
    }

    const raw = localStorage.getItem(name)
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw)
      const envelope: PersistEnvelope = isEnvelope(parsed)
        ? parsed
        : ({ state: parsed as ConfigState, version: 1 } as PersistEnvelope)

      // Replace any "id:<uuid>" strings with data URLs throughout state
      envelope.state = await deepMapStringsAsync(envelope.state, async (s) => {
        if (s.startsWith("id:")) return (await this.loadImage(s)) ?? s
        return s // pass through http(s), blob:, data:, etc.
      })

      return JSON.stringify(envelope)
    } catch (e) {
      console.error("HybridStorage.getItem parse error:", e)
      return raw // fallback
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name)
      return
    }

    // Parse the new envelope
    let newEnv: PersistEnvelope
    try {
      const parsed = JSON.parse(value)
      newEnv = isEnvelope(parsed)
        ? parsed
        : ({ state: parsed as ConfigState, version: 1 } as PersistEnvelope)
    } catch (e) {
      console.error("HybridStorage.setItem parse error; storing raw:", e)
      localStorage.setItem(name, value)
      return
    }

    // Parse the previous envelope (to discover stale ids)
    let oldEnv: PersistEnvelope | null = null
    const oldRaw = localStorage.getItem(name)
    if (oldRaw) {
      try {
        const prev = JSON.parse(oldRaw)
        oldEnv = isEnvelope(prev)
          ? prev
          : ({ state: prev as ConfigState, version: 1 } as PersistEnvelope)
      } catch {
        oldEnv = null
      }
    }

    // Collect old ids to potentially clean up
    const oldIds = new Set<string>()
    if (oldEnv?.state) {
      deepForEachString(oldEnv.state, (s) => {
        if (s.startsWith("id:")) oldIds.add(s.slice(3))
      })
    }

    // Convert any data: URLs in the new state into id:<uuid>, tracking kept ids
    const keptIds = new Set<string>()
    const nextState = await deepMapStringsAsync(newEnv.state, async (s) => {
      if (s.startsWith("data:")) {
        const id = crypto.randomUUID()
        await this.db.images.put({ id, data: s })
        keptIds.add(id)
        return "id:" + id
      }
      if (s.startsWith("id:")) {
        keptIds.add(s.slice(3))
        return s
      }
      return s // passthrough
    })

    // Delete any old ids that are no longer referenced
    for (const id of oldIds) {
      if (!keptIds.has(id)) {
        try {
          await this.db.images.delete(id)
        } catch (e) {
          console.warn("Failed to delete stale image id:", id, e)
        }
      }
    }

    const finalStr = JSON.stringify({
      state: nextState,
      version: newEnv.version ?? 1,
    })
    localStorage.setItem(name, finalStr)
  }

  removeItem(name: string): void {
    if (name !== CONFIG_KEY) {
      localStorage.removeItem(name)
      return
    }

    try {
      const raw = localStorage.getItem(name)
      if (raw) {
        const parsed = JSON.parse(raw)
        const env: PersistEnvelope = isEnvelope(parsed)
          ? parsed
          : ({ state: parsed as ConfigState, version: 1 } as PersistEnvelope)

        const ids = new Set<string>()
        deepForEachString(env.state, (s) => {
          if (s.startsWith("id:")) ids.add(s.slice(3))
        })
        ids.forEach((id) => this.db.images.delete(id))
      }
    } catch (e) {
      console.warn("Cleanup on removeItem failed (continuing):", e)
    }

    localStorage.removeItem(name)
  }
}
