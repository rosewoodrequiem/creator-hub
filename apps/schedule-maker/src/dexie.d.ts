// dexie-augment.d.ts
import 'dexie'
import type { Table } from 'dexie'

import {
  GlobalRow,
  ImageRow,
  Schedule,
  ScheduleComponent,
  ScheduleComponentProps,
  ScheduleDay,
  Theme,
} from './store/schedule-maker-db/SheduleMakerDB.types'

declare module 'dexie' {
  interface Transaction extends DB {}
}

type DB = {
  images: Table<ImageRow, number>
  schedules: Table<Schedule, number>
  scheduleDays: Table<ScheduleDay, number>
  components: Table<ScheduleComponent, number>
  componentProps: Table<ScheduleComponentProps, number>
  themes: Table<Theme, number>
  global: Table<GlobalRow, number>
}
