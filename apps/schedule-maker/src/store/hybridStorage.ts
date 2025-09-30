import { StateStorage } from "zustand/middleware"
import { isPlainObject } from "lodash"
import { ConfigState } from "./useConfig.types"
import { deepMapStringsAsync, deepForEachString } from "../utils/object"
import { ScheduleMakerDB } from "./scheduleMakerDB"

const CONFIG_KEY = "schedule-maker-config"

type PersistEnvelope = {
  state: ConfigState
  version: number
}

const isEnvelope = (v: unknown): v is PersistEnvelope =>
  isPlainObject(v) && "state" in (v as any) && "version" in (v as any)

export class HybridStorage implements StateStorage {
  private db = new ScheduleMakerDB()

  private async loadImage(idOrUrl?: string): Promise<string | undefined> {
    if (!idOrUrl || !idOrUrl.startsWith("id:")) return idOrUrl
    const id = idOrUrl.slice(3)
    if (!id) return undefined
    const row = await this.db.images.get(id)
    return row?.data
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

      // Cache IDB reads within this pass (avoid duplicate gets)
      const idReadCache = new Map<string, string | undefined>()

      envelope.state = await deepMapStringsAsync(envelope.state, async (s) => {
        if (!s.startsWith("id:")) return s
        const id = s.slice(3)
        if (!id) return s
        if (idReadCache.has(id)) return idReadCache.get(id) ?? s
        const data = await this.loadImage(s)
        idReadCache.set(id, data)
        return data ?? s // keep "id:" if missing so references aren't lost
      })

      // Ensure version is numeric
      if (typeof envelope.version !== "number") envelope.version = 1

      return JSON.stringify(envelope)
    } catch (e) {
      console.error("HybridStorage.getItem parse error:", e)
      return raw // fallback—let persist try
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name)
      return
    }

    // Parse new envelope
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

    // Parse old envelope (to find stale ids)
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

    // Collect all old IDs
    const oldIds = new Set<string>()
    if (oldEnv?.state) {
      deepForEachString(oldEnv.state, (s) => {
        if (s.startsWith("id:")) {
          const id = s.slice(3)
          if (id) oldIds.add(id)
        }
      })
    }

    // Deduplicate data: writes within this call
    const keptIds = new Set<string>()
    const dataUrlToId = new Map<string, string>() // data:... -> id
    const makeId = () =>
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`

    const nextState = await deepMapStringsAsync(newEnv.state, async (s) => {
      if (s.startsWith("data:")) {
        // Reuse existing id if this exact data URL already seen in this save
        let id = dataUrlToId.get(s)
        if (!id) {
          id = makeId()
          try {
            await this.db.images.put({ id, data: s })
          } catch (err) {
            console.warn("IDB put failed; leaving data URL inline", err)
            return s // keep data: inline if quota/IDB error
          }
          dataUrlToId.set(s, id)
        }
        keptIds.add(id)
        return "id:" + id
      }

      if (s.startsWith("id:")) {
        const id = s.slice(3)
        if (id) keptIds.add(id)
        return s
      }

      // http(s), blob:, other strings — passthrough
      return s
    })

    // Remove stale IDs not referenced anymore
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
      version: typeof newEnv.version === "number" ? newEnv.version : 1,
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
          if (s.startsWith("id:")) {
            const id = s.slice(3)
            if (id) ids.add(id)
          }
        })
        ids.forEach((id) => this.db.images.delete(id))
      }
    } catch (e) {
      console.warn("Cleanup on removeItem failed (continuing):", e)
    }

    localStorage.removeItem(name)
  }
}
