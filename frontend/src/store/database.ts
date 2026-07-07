import { create } from "zustand";
import {
  ConnectToDatabase,
  DisconnectFirestore,
  IsDatabaseConnected,
  GetDatabaseConnectionStatus,
} from "../../wailsjs/go/main/App";
import { database } from "../../wailsjs/go/models";

interface DatabaseStore {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  config: database.ConnectionConfig | null;
  connect: (config: database.ConnectionConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  hydrate: () => Promise<void>;
  getConnectionStatus: () => Promise<void>;
}

export const useDatabaseStore = create<DatabaseStore>((set) => ({
  connected: false,
  connecting: false,
  error: null,
  config: null,
  // Called on app boot to check if already connected
  hydrate: async () => {
    const connected = await IsDatabaseConnected();
    set({ connected });
  },

  connect: async (config) => {
    set({ connecting: true, error: null });
    try {
      await ConnectToDatabase(config);
      set({ connected: true, connecting: false });
    } catch (e: any) {
      set({ error: e, connecting: false });
    }
  },

  getConnectionStatus: async () => {
    const config = await GetDatabaseConnectionStatus();
    if (typeof config === "boolean") {
      set({ connected: config, config: null });
    } else {
      set({ connected: true, config });
    }
  },

  disconnect: async () => {
    await DisconnectFirestore();
    set({ connected: false, error: null, config: null });
  },
}));
