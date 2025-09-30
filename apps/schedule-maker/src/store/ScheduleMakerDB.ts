// db/scheduleDb.ts
import Dexie, { Table } from "dexie"
import { Component } from "react"
import { Schedule } from "./SheduleMakerDB.types"

const DB_NAME = "schedule-maker"
export const CURRENT_SCHEDULE_KEY = "schedule-maker/currentScheduleId"

export class ScheduleMakerDB extends Dexie {
  images!: Table<{ id: string; data: string }, string>
  schedules!: Table<Schedule, string>
  components!: Table<Component, string>

  constructor() {
    super(DB_NAME)

    this.version(1).stores({
      images: "id",
      schedules: "id, name, updatedAt",
      components: "id, scheduleId -> schedules.id, kind, zIndex, updatedAt",
    })
  }
}

export const db = new ScheduleMakerDB()

export function getCurrentScheduleId(): string | null {
  return localStorage.getItem(CURRENT_SCHEDULE_KEY)
}
export function setCurrentScheduleId(id: string) {
  localStorage.setItem(CURRENT_SCHEDULE_KEY, id)
}
export function clearCurrentScheduleId() {
  localStorage.removeItem(CURRENT_SCHEDULE_KEY)
}
