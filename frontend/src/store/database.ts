import { create } from "zustand";
import {
  ConnectToDatabase,
  DisconnectFirestore,
  IsDatabaseConnected,
} from "../../wailsjs/go/main/App";
import { database } from "../../wailsjs/go/models";

interface DatabaseStore {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: (config: database.ConnectionConfig) => Promise<void>;
  disconnect: () => void;
  hydrate: () => Promise<void>;
}

export const useDatabaseStore = create<DatabaseStore>((set) => ({
  connected: false,
  connecting: false,
  error: null,

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

  disconnect: () => {
    DisconnectFirestore();
    set({ connected: false, error: null });
  },
}));
