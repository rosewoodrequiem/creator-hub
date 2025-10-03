import Dexie from "dexie"
import relationships from "dexie-relationships"

import { seed } from "./seed"
import { DB } from "../../dexie"

const DB_NAME = "schedule-maker"
export const CURRENT_SCHEDULE_KEY = "currentScheduleId"

export class ScheduleMakerDB extends Dexie {

  constructor() {
    super(DB_NAME, { addons: [relationships] })

    this.version(1).stores({
      images: "++id",
      schedules: "++id, name, updatedAt",
      scheduleData: "++id, weekStart, weekOffset, heroUrl",
      scheduleDayPlan: "++id, day, gameName, time, gameGraphic -> images.id",
      components: "++id, scheduleId -> schedules.id, kind, zIndex, updatedAt",
      global: "++id, currentScheduleId -> schedules.id",
    })

    // 🔑 Bind tables at runtime (this is what interface merging doesn't do)
    this.images = this.table("images");
    this.schedules = this.table("schedules");
    this.scheduleData = this.table("scheduleData");
    this.scheduleDayPlan = this.table("scheduleDayPlan");
    this.components = this.table("components");
    this.global = this.table("global");

    this.on("populate", function (transaction) {
      seed(transaction)
    });
  }

  get scheduleId() {
    return this.global.get(1).then(g => g?.currentScheduleId ?? null)
  }

  get weekStart() {
    return this.scheduleData.get(1).then(d => d?.weekStart ?? 1)
  }
}

export interface ScheduleMakerDB extends DB { }
export const db = new ScheduleMakerDB()