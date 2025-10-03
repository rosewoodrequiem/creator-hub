import Dexie, { Table } from "dexie"
import relationships from "dexie-relationships"

import { Schedule, ScheduleComponent } from "./SheduleMakerDB.types"
import { seed } from "./seed"

const DB_NAME = "schedule-maker"
export const CURRENT_SCHEDULE_KEY = "currentScheduleId"

export class ScheduleMakerDB extends Dexie {
  images!: Table<{ id: string; data: string }, string>
  schedules!: Table<Schedule, string>
  components!: Table<ScheduleComponent, string>
  global!: Table<{ id: string; currentScheduleId: string | null }, string>

  constructor() {
    super(DB_NAME, { addons: [relationships] })

    this.version(1).stores({
      images: "++id",
      schedules: "++id, name, updatedAt",
      components: "++id, scheduleId -> schedules.id, kind, zIndex, updatedAt",
      scheduleData: "++id, scheduleId -> schedules.id",
      global: "++id, currentScheduleId -> schedules.id",
    })

    this.on("populate", function (transaction) {
      seed(transaction)
    });
  }
}

export const db = new ScheduleMakerDB()