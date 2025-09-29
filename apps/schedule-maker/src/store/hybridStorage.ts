import type { StateStorage } from "zustand/middleware";
import Dexie from "dexie";
import type { ConfigState } from "./useConfig";
import type { DayPlan } from "../types";

const DB_NAME = "schedule-maker";
const CONFIG_KEY = "schedule-maker-config";

// The persisted envelope that zustand/persist expects when using createJSONStorage
type PersistEnvelope = {
  state: ConfigState;
  version: number;
};

class ImageDB extends Dexie {
  images!: Dexie.Table<{ id: string; data: string }, string>;
  constructor() {
    super(DB_NAME);
    this.version(1).stores({ images: "id" });
  }
}

export class HybridStorage implements StateStorage {
  private db: ImageDB;

  constructor() {
    this.db = new ImageDB();
  }

  // ---------- helpers ----------
  private async loadImage(idOrUrl?: string): Promise<string | undefined> {
    if (!idOrUrl) return undefined;

    // Pass through normal URLs and data URLs
    if (!idOrUrl.startsWith("id:")) return idOrUrl;

    const id = idOrUrl.slice(3);
    const image = await this.db.images.get(id);
    return image?.data; // return a data URL (or undefined)
  }

  private async saveImageMaybe(
    oldIdRef: string | undefined,
    maybeDataUrl?: string,
  ) {
    // Returns the *stored reference* that should be kept in state (e.g., "id:<uuid>" or undefined)
    // Only store when we truly have a data URL
    if (!maybeDataUrl) {
      // If we had an old id: remove it
      if (oldIdRef?.startsWith("id:")) {
        const oldId = oldIdRef.slice(3);
        await this.db.images.delete(oldId);
      }
      return undefined;
    }

    if (!maybeDataUrl.startsWith("data:")) {
      // External URL or blob: just keep as-is (do NOT try to stash blob: in IDB with the blob URL as key)
      return maybeDataUrl;
    }

    // New data URL — save and return id: reference
    // Delete prior id if we’re replacing
    if (oldIdRef?.startsWith("id:")) {
      const oldId = oldIdRef.slice(3);
      await this.db.images.delete(oldId);
    }

    const id = crypto.randomUUID();
    await this.db.images.put({ id, data: maybeDataUrl });
    return "id:" + id;
  }

  // ---------- StateStorage impl ----------
  async getItem(name: string): Promise<string | null> {
    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name);
      return null;
    }

    const raw = localStorage.getItem(name);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);

      // MIGRATION: If we find a plain config (no envelope), wrap it
      const envelope: PersistEnvelope =
        parsed &&
        typeof parsed === "object" &&
        "state" in parsed &&
        "version" in parsed
          ? (parsed as PersistEnvelope)
          : ({ state: parsed as ConfigState, version: 1 } as PersistEnvelope);

      const cfg = envelope.state;

      // Load hero + day images into data URLs for the in-memory state
      const heroDataUrl = await this.loadImage(cfg.heroUrl);

      const dayKeys = Object.keys(cfg.week.days);
      const toLoad: Array<Promise<string | undefined>> = [];
      for (const k of dayKeys) {
        const d = cfg.week.days[k as keyof typeof cfg.week.days] as DayPlan;
        toLoad.push(this.loadImage(d.logoUrl));
        toLoad.push(this.loadImage(d.graphicUrl));
      }
      const loaded = await Promise.all(toLoad);

      let idx = 0;
      for (const k of dayKeys) {
        const d = cfg.week.days[k as keyof typeof cfg.week.days] as DayPlan;
        d.logoUrl = loaded[idx++];
        d.graphicUrl = loaded[idx++];
      }
      cfg.heroUrl = heroDataUrl;

      // Return the proper envelope string for createJSONStorage to parse
      return JSON.stringify(envelope);
    } catch (e) {
      console.error("HybridStorage.getItem parse error:", e);
      return raw; // last resort; let persist try
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    if (name !== CONFIG_KEY) {
      console.warn("Unexpected storage key:", name);
      return;
    }

    // `value` here is the full JSON string of { state, version } because of createJSONStorage
    let envelope: PersistEnvelope;
    try {
      const parsed = JSON.parse(value);

      // MIGRATION: if persist hands us raw (unlikely), wrap it
      if (!parsed || typeof parsed !== "object" || !("state" in parsed)) {
        envelope = { state: parsed as ConfigState, version: 1 };
      } else {
        envelope = parsed as PersistEnvelope;
      }
    } catch (e) {
      console.error("HybridStorage.setItem parse error; storing raw:", e);
      localStorage.setItem(name, value);
      return;
    }

    const next = envelope.state;

    // Load old envelope (if any) to get old id refs for cleanup/replacement
    let oldEnvelope: PersistEnvelope | null = null;
    const oldRaw = localStorage.getItem(name);
    if (oldRaw) {
      try {
        const p = JSON.parse(oldRaw);
        oldEnvelope =
          p && typeof p === "object" && "state" in p && "version" in p
            ? (p as PersistEnvelope)
            : ({ state: p as ConfigState, version: 1 } as PersistEnvelope);
      } catch {
        oldEnvelope = null;
      }
    }
    const old = oldEnvelope?.state;

    // HERO
    const newHeroRef = await this.saveImageMaybe(old?.heroUrl, next.heroUrl);
    next.heroUrl = newHeroRef;

    // DAYS
    for (const [k, day] of Object.entries(next.week.days)) {
      const oldDay = old?.week.days?.[k] as DayPlan | undefined;

      const newLogoRef = await this.saveImageMaybe(
        oldDay?.logoUrl,
        day.logoUrl,
      );
      const newGraphicRef = await this.saveImageMaybe(
        oldDay?.graphicUrl,
        day.graphicUrl,
      );

      (day as DayPlan).logoUrl = newLogoRef;
      (day as DayPlan).graphicUrl = newGraphicRef;
    }

    // Save envelope back (must keep { state, version } intact)
    const finalStr = JSON.stringify({
      state: next,
      version: envelope.version ?? 1,
    });
    localStorage.setItem(name, finalStr);
  }

  removeItem(name: string): void {
    if (name !== CONFIG_KEY) return localStorage.removeItem(name);

    // Optional: clean up any stored images that are referenced by the current record
    try {
      const raw = localStorage.getItem(name);
      if (raw) {
        const parsed = JSON.parse(raw);
        const env: PersistEnvelope =
          parsed && typeof parsed === "object" && "state" in parsed
            ? parsed
            : { state: parsed as ConfigState, version: 1 };

        const ids = new Set<string>();
        const s = env.state;

        if (s.heroUrl?.startsWith("id:")) ids.add(s.heroUrl.slice(3));
        for (const day of Object.values(s.week.days) as DayPlan[]) {
          if (day.logoUrl?.startsWith("id:")) ids.add(day.logoUrl.slice(3));
          if (day.graphicUrl?.startsWith("id:"))
            ids.add(day.graphicUrl.slice(3));
        }

        ids.forEach((id) => this.db.images.delete(id));
      }
    } catch (e) {
      console.warn("Cleanup on removeItem failed (continuing):", e);
    }

    localStorage.removeItem(name);
  }
}
