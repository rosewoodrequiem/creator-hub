import { StateStorage } from "zustand/middleware"
import { isPlainObject } from "lodash"
import { ConfigState } from "./useConfig.types"
import { deepMapStringsAsync, deepForEachString } from "../utils/object"
import { ScheduleMakerDB } from "./schedule-maker-db/ScheduleMakerDB"
//import { ensureSeed } from "./schedule-maker-db/seed"

const CONFIG_KEY = "schedule-maker-config"

type PersistEnvelope = { state: ConfigState; version: number }
const isEnvelope = (v: unknown): v is PersistEnvelope =>
  isPlainObject(v) && "state" in (v as any) && "version" in (v as any)

export class HybridStorage implements StateStorage {
  private db = new ScheduleMakerDB()
  // lazy, shared seed promise (avoids double work on concurrent calls)
  private seedOnce: Promise<string | null> | null = null

  private async ensureSeedOnce(): Promise<string | null> {
    if (!this.seedOnce) {
      /*this.seedOnce = ensureSeed()
        .then((id) => id ?? null)
        .catch((e) => {
          console.error("ensureSeed failed:", e)
          return null
        })*/
    }
    return this.seedOnce
  }

  private async loadImage(idOrUrl?: string): Promise<string | undefined> {
    if (!idOrUrl || !idOrUrl.startsWith("id:")) return idOrUrl
    const id = idOrUrl.slice(3)
    if (!id) return undefined
    const row = await this.db.images.get(id)
    return row?.data
  }

  async getItem(name: string): Promise<string | null> {
    await this.ensureSeedOnce()

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

      // cache idb reads during this pass
      const idReadCache = new Map<string, string | undefined>()
      envelope.state = await deepMapStringsAsync(envelope.state, async (s) => {
        if (!s.startsWith("id:")) return s
        const id = s.slice(3)
        if (!id) return s
        if (idReadCache.has(id)) return idReadCache.get(id) ?? s
        const data = await this.loadImage(s)
        idReadCache.set(id, data)
        return data ?? s
      })

      if (typeof envelope.version !== "number") envelope.version = 1
      return JSON.stringify(envelope)
    } catch (e) {
      console.error("HybridStorage.getItem parse error:", e)
      return raw // fallback
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    // ✅ also seed on writes (covers first-ever save flows)
    await this.ensureSeedOnce()

    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name)
      return
    }

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

    // read old (for stale id cleanup)
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

    const oldIds = new Set<string>()
    if (oldEnv?.state) {
      deepForEachString(oldEnv.state, (s) => {
        if (s.startsWith("id:")) {
          const id = s.slice(3)
          if (id) oldIds.add(id)
        }
      })
    }

    const keptIds = new Set<string>()
    const dataUrlToId = new Map<string, string>()
    const makeId = () =>
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`

    const nextState = await deepMapStringsAsync(newEnv.state, async (s) => {
      if (s.startsWith("data:")) {
        let id = dataUrlToId.get(s)
        if (!id) {
          id = makeId()
          try {
            await this.db.images.put({ id, data: s })
          } catch (err) {
            console.warn("IDB put failed; leaving data URL inline", err)
            return s
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
      return s
    })

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

  async removeItem(name: string): Promise<void> {
    // ✅ seed isn’t strictly necessary here, but harmless if called
    await this.ensureSeedOnce()

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
