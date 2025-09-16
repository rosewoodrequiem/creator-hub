import type { StateStorage } from "zustand/middleware"
import Dexie from "dexie"
import type { ConfigState } from "./useConfigStore"
import type { DayPlan } from "../types"

const DB_NAME = "schedule-maker-images"
const CONFIG_KEY = "schedule-maker-config"

class ImageDB extends Dexie {
  images!: Dexie.Table<{ id: string; data: string }, string>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      images: "id",
    })
  }
}

export class HybridStorage implements StateStorage {
  private db: ImageDB

  constructor() {
    this.db = new ImageDB()
  }

  async getItem(name: string): Promise<string | null> {
    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name)
      return null
    }

    const rawConfig = localStorage.getItem(name)
    if (!rawConfig) return null

    try {
      const config = JSON.parse(rawConfig)

      // Load images from IndexedDB
      const loadImage = async (url: string | undefined) => {
        if (!url?.startsWith("blob:") && !url?.startsWith("data:")) return url
        const id = url.startsWith("blob:") ? url.slice(5) : url
        const image = await this.db.images.get(id)
        return image?.data
      }

      // Load hero image
      config.heroUrl = await loadImage(config.heroUrl)

      // Load day images
      for (const [key, day] of Object.entries(config.week.days)) {
        const updatedDay = day as DayPlan
        updatedDay.logoUrl = await loadImage(updatedDay.logoUrl)
        updatedDay.graphicUrl = await loadImage(updatedDay.graphicUrl)
        config.week.days[key] = updatedDay
      }

      return JSON.stringify(config)
    } catch (error) {
      console.error("Error loading config:", error)
      return rawConfig
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name)
      return
    }

    try {
      const config = JSON.parse(value)
      const newConfig = { ...config }

      // Store hero image
      if (config.heroUrl?.startsWith("data:")) {
        const id = crypto.randomUUID()
        await this.db.images.put({ id, data: config.heroUrl })
        newConfig.heroUrl = "blob:" + id
      }

      // Store day images
      for (const [key, day] of Object.entries(config.week.days)) {
        const currentDay = day as DayPlan
        const newDay = { ...currentDay }

        if (currentDay.logoUrl?.startsWith("data:")) {
          const id = crypto.randomUUID()
          await this.db.images.put({ id, data: currentDay.logoUrl })
          newDay.logoUrl = "blob:" + id
        }

        if (currentDay.graphicUrl?.startsWith("data:")) {
          const id = crypto.randomUUID()
          await this.db.images.put({ id, data: currentDay.graphicUrl })
          newDay.graphicUrl = "blob:" + id
        }

        newConfig.week.days[key] = newDay
      }

      localStorage.setItem(name, JSON.stringify(newConfig))
    } catch (error) {
      console.error("Error saving config:", error)
      localStorage.setItem(name, value)
    }
  }

  removeItem(name: string): void {
    localStorage.removeItem(name)
  }
}
