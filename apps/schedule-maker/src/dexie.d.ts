// dexie-augment.d.ts
import "dexie";
import type { Table } from "dexie";
import { Schedule, ScheduleComponent } from "./store/schedule-maker-db/SheduleMakerDB.types";

declare module "dexie" {
    interface Transaction extends DB {
    }
}

type Images = {
    id: string;
    data: string;
}

type Global = {
    id: string;
    currentScheduleId: string | null;
}

type DB = {
    images: Table<Images, string>;
    schedules: Table<Schedule, string>;
    components: Table<ScheduleComponent, string>;
    global: Table<Global, string>;
}