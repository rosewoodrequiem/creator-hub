import type { StateStorage } from "zustand/middleware"
import Dexie from "dexie"
import type { ConfigState } from "./useConfig"
import type { DayPlan } from "../types"

const DB_NAME = "schedule-maker"
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
    console.log("Getting item", name)
    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name)
      return null
    }

    const rawConfig = localStorage.getItem(name)
    if (!rawConfig) return null

    try {
      const config = JSON.parse(rawConfig)
      console.log("Loaded config", config)

      // Load images from IndexedDB
      const loadImage = async (url: string | undefined) => {
        if (!url) return undefined
        if (
          !url.startsWith("id:") &&
          !url.startsWith("blob:") &&
          !url.startsWith("data:")
        )
          return url
        const id = url.startsWith("id:")
          ? url.slice(3)
          : url.startsWith("blob:")
            ? url.slice(5)
            : url
        console.log("Loading image", url, "ID", id)
        const image = await this.db.images.get(id)
        console.log("Loaded image", image?.data ? "data:..." : "undefined")
        return image?.data
      }

      // Load all images in parallel
      const [heroImage, ...dayImages] = await Promise.all([
        loadImage(config.heroUrl),
        ...Object.entries(config.week.days).flatMap(([_, day]) => [
          loadImage((day as DayPlan).logoUrl),
          loadImage((day as DayPlan).graphicUrl),
        ]),
      ])

      // Update config with loaded images
      config.heroUrl = heroImage
      console.log("Loaded hero image", config.heroUrl)

      let dayImageIndex = 0
      for (const [key, day] of Object.entries(config.week.days)) {
        const updatedDay = day as DayPlan
        updatedDay.logoUrl = dayImages[dayImageIndex++]
        updatedDay.graphicUrl = dayImages[dayImageIndex++]
        config.week.days[key] = updatedDay
      }

      console.log("Final loaded config", {
        hasHeroUrl: !!config.heroUrl,
        heroUrlType: typeof config.heroUrl,
        heroUrlStart: config.heroUrl?.substring(0, 20),
      })

      const finalConfig = JSON.stringify(config)
      console.log("Returning config string length:", finalConfig.length)
      return finalConfig
    } catch (error) {
      console.error("Error loading config:", error)
      // Try to parse and return the config even if image loading fails
      try {
        return JSON.stringify(JSON.parse(rawConfig))
      } catch (parseError) {
        console.error("Error parsing raw config:", parseError)
        return null
      }
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    console.log("Setting item", name, value)
    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name)
      return
    }

    try {
      const parsed = JSON.parse(value)
      const config = parsed.state || parsed
      console.log("Parsed config to save:", {
        hasHeroUrl: !!config.heroUrl,
        heroUrlType: typeof config.heroUrl,
        heroUrlStart: config.heroUrl?.substring(0, 20),
      })
      const newConfig = { ...config }

      // Handle hero image
      const oldState = localStorage.getItem(name)
      const oldConfig = oldState ? JSON.parse(oldState) : null
      const oldHeroUrl = oldConfig?.heroUrl

      if (config.heroUrl?.startsWith("data:")) {
        // Delete old hero image if it exists
        if (oldHeroUrl?.startsWith("id:")) {
          const oldId = oldHeroUrl.slice(3)
          console.log("Deleting old hero image", oldId)
          await this.db.images.delete(oldId)
        }

        // Store new hero image
        const id = crypto.randomUUID()
        console.log("Saving new hero image with id", id)
        await this.db.images.put({ id, data: config.heroUrl })
        newConfig.heroUrl = "id:" + id
      } else if (!config.heroUrl && oldHeroUrl?.startsWith("id:")) {
        // If hero image was removed, delete it from DB
        const oldId = oldHeroUrl.slice(3)
        console.log("Deleting removed hero image", oldId)
        await this.db.images.delete(oldId)
        newConfig.heroUrl = undefined
      }

      // Store day images
      for (const [key, day] of Object.entries(config.week.days)) {
        const currentDay = day as DayPlan
        const newDay = { ...currentDay }

        if (currentDay.logoUrl?.startsWith("data:")) {
          const id = crypto.randomUUID()
          await this.db.images.put({ id, data: currentDay.logoUrl })
          newDay.logoUrl = "id:" + id
        }

        if (currentDay.graphicUrl?.startsWith("data:")) {
          const id = crypto.randomUUID()
          await this.db.images.put({ id, data: currentDay.graphicUrl })
          newDay.graphicUrl = "id:" + id
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
