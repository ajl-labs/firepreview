import { create } from "zustand";
import { ListCollections } from "../../wailsjs/go/main/App";
import { database } from "../../wailsjs/go/models";

interface ExplorerStore {
  collections: database.CollectionInfo[];
  loading: boolean;
  error: string | null;
  fetchCollections: () => Promise<void>;
}

export const useExplorerStore = create<ExplorerStore>((set) => ({
  collections: [],
  loading: false,
  error: null,

  fetchCollections: async () => {
    set({ loading: true, error: null });
    try {
      const collections = await ListCollections();
      set({ collections: collections ?? [], loading: false });
    } catch (e: any) {
      set({ error: String(e), loading: false });
    }
  },
}));
