import type { StateStorage } from "zustand/middleware";
import Dexie from "dexie";

class ConfigDatabase extends Dexie {
  config: Dexie.Table<any, string>;

  constructor() {
    super("schedule-maker");
    this.version(1).stores({
      config: "key",
    });
    this.config = this.table("config");
  }
}

export class DexieStorage implements StateStorage {
  private db: ConfigDatabase;
  private fallbackStorage: StateStorage;

  constructor() {
    this.db = new ConfigDatabase();
    this.fallbackStorage = localStorage;
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const result = await this.db.config.get(key);
      if (!result) {
        // Try localStorage as fallback for legacy data
        const item = this.fallbackStorage.getItem(key) as string | null;
        if (item) {
          const parsed = JSON.parse(item);
          // Migrate to Dexie
          await this.setItem(key, parsed);
          return parsed;
        }
        return null;
      }
      return result.value;
    } catch (error) {
      console.warn(
        `Dexie get failed for key "${key}", using localStorage`,
        error,
      );
      const item = this.fallbackStorage.getItem(key) as string | null;
      return item ? JSON.parse(item) : null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await this.db.config.put({ key, value }, key);
      // Also update localStorage as backup
      this.fallbackStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(
        `Dexie set failed for key "${key}", using localStorage`,
        error,
      );
      this.fallbackStorage.setItem(key, JSON.stringify(value));
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.db.config.delete(key);
      this.fallbackStorage.removeItem(key);
    } catch (error) {
      console.warn(
        `Dexie delete failed for key "${key}", using localStorage`,
        error,
      );
      this.fallbackStorage.removeItem(key);
    }
  }
}
