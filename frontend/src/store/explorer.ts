import { create } from "zustand";
import { ListCollections } from "../../wailsjs/go/main/App";
import { database } from "../../wailsjs/go/models";
import { PaginationState } from "@tanstack/react-table";

interface ExplorerStore {
  collections: database.CollectionInfo[];
  loading: boolean;
  error: string | null;
  fetchCollections: () => Promise<void>;
  pageIndex: number;
  pageSize: number;
  setPagination: (pagination: PaginationState) => void;
}

export const useExplorerStore = create<ExplorerStore>((set) => ({
  collections: [],
  loading: false,
  error: null,
  pageIndex: 0,
  pageSize: 15,

  fetchCollections: async () => {
    set({ loading: true, error: null });
    try {
      const collections = await ListCollections();
      set({ collections: collections ?? [], loading: false });
    } catch (e: any) {
      set({ error: String(e), loading: false });
    }
  },

  setPagination: (pagination) => {
    set((state) => ({
      ...state,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    }));
  },
}));
