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
  getConnectionStatus: () => Promise<database.ConnectionStatus>;
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
      await useDatabaseStore.getState().getConnectionStatus();
    } catch (e: any) {
      set({ error: e, connecting: false });
    } finally {
      set({ connecting: false });
    }
  },

  getConnectionStatus: async () => {
    const status = await GetDatabaseConnectionStatus();
    set({ connected: status.connected, config: status.config });
    return status;
  },

  disconnect: async () => {
    await DisconnectFirestore();
    set({ connected: false, error: null, config: null });
  },
}));
