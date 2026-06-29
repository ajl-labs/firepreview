import { create } from "zustand";
import { GetCollection } from "../../wailsjs/go/main/App";
import { database } from "../../wailsjs/go/models";
const PAGE_SIZE = 50; // Default page size

interface CollectionStore {
  documents: database.DocumentResult[];
  total: number;
  loading: boolean;
  error: string | null;
  fields: database.FieldInfo[];
  pageToken: string; // For pagination
  nextPageToken: string; // For pagination
  hasMore: boolean; // Indicates if there are more documents to fetch
  pageSize: number; // Number of documents per page
  fetchCollection: (collectionName: string, pageToken: string) => Promise<void>;
  reset: () => void; // Reset the store to its initial state
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  documents: [],
  total: 0,
  loading: false,
  error: null,
  fields: [],
  pageToken: "",
  nextPageToken: "",
  hasMore: false, // Initialize hasMore to false
  pageSize: PAGE_SIZE, // Set the default page size
  reset: () =>
    set({
      documents: [],
      total: 0,
      loading: false,
      error: null,
      fields: [],
      pageToken: "",
      nextPageToken: "",
      hasMore: false,
    }),

  fetchCollection: async (collectionName: string, pageToken: string = "") => {
    set({ loading: true, error: null });
    try {
      const {
        documents = [],
        total,
        fields,
        nextPageToken: newNextPageToken = "",
      } = await GetCollection(collectionName, {
        limit: PAGE_SIZE,
        pageToken,
      });

      set((state) => ({
        documents: pageToken ? [...state.documents, ...documents] : documents,
        total: total ?? 0,
        fields: fields ?? [],
        loading: false,
        nextPageToken: newNextPageToken ?? "", // Store the next page token for pagination
        hasMore: !!newNextPageToken, // Update hasMore based on the presence of a next page token
      }));
    } catch (e: any) {
      set({ error: String(e), loading: false });
    }
  },
}));
