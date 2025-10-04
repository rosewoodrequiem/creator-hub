// dexie-augment.d.ts
import 'dexie'
import type { Table } from 'dexie'
import {
  Schedule,
  ScheduleComponent,
} from './store/schedule-maker-db/SheduleMakerDB.types'
import { Day } from './types/Day'

declare module 'dexie' {
  interface Transaction extends DB {}
}

type Images = {
  id?: number
  data: string
}

type Global = {
  id?: number
  currentScheduleId: number | null // FK to schedules.id
}

type DBScheduleDayPlan = {
  id: number
  gameName: string
  day: Day
  time: string
  enabled: boolean
  gameGraphic?: number // FK -> images.id
}

type ScheduleData = {
  id?: number
  weekStart: Day
  weekAnchor?: Date
  timezone?: string
  heroUrl?: number // FK -> images.id
}

type DB = {
  images: Table<Images, number>
  schedules: Table<Schedule, number>
  scheduleData: Table<ScheduleData, number>
  scheduleDayPlan: Table<DBScheduleDayPlan, number>
  components: Table<ScheduleComponent, number>
  global: Table<Global, number>
}
