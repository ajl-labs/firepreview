import { create } from "zustand";
import { GetCollection, BulkDeleteDocuments } from "../../wailsjs/go/main/App";
import { database } from "../../wailsjs/go/models";
import { toast } from "sonner";

const PAGE_SIZE = 50; // Default page size

interface CollectionState {
  documents: database.DocumentResult[];
  total: number;
  loading: boolean;
  error: string | null;
  fields: database.CollectionDocFieldInfo[];

  collectionName: string;
  query: string;
  page: number;
  pageSize: number;
  totalPages: number;
  cursorStack: string[];
  nextCursor: string;
  prevCursor: string;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CollectionStore {
  fetchCollection: (
    collectionName: string,
    options?: Partial<database.QueryParams>,
  ) => Promise<void>;
  nextPage: (collectionName: string) => Promise<void>;
  prevPage: (collectionName: string) => Promise<void>;
  reset: () => void;
  bulkDeleteDocuments: (
    collectionName: string,
    documentIds: string[],
  ) => Promise<void>;
  search: (collectionName: string, query: string) => Promise<void>;
  data: Record<string, CollectionState>;
}

export const defaultCollectionState: CollectionState = {
  documents: [],
  total: 0,
  loading: false,
  error: null,
  fields: [],
  collectionName: "",
  query: "",
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 0,
  cursorStack: [],
  nextCursor: "",
  prevCursor: "",
  hasNext: false,
  hasPrev: false,
};

export const useCollectionStore = create<CollectionStore>((set, get) => {
  const executeQuery = async (
    collectionName: string,
    queryParams: Partial<database.QueryParams>,
    stateOverrides?: Partial<CollectionState>,
  ) => {
    const existing = get().data[collectionName] ?? defaultCollectionState;
    const { pageSize } = existing;

    set({
      data: {
        ...get().data,
        [collectionName]: {
          ...existing,
          loading: true,
          error: null,
        },
      },
    });

    try {
      const {
        documents = [],
        fields,
        total = 0,
        nextCursor = "",
        prevCursor = "",
        hasNext = false,
        hasPrev = false,
      } = await GetCollection(collectionName, {
        limit: pageSize,
        query: "",
        docId: "",
        direction: "",
        ...queryParams,
      });
      set({
        data: {
          ...get().data,
          [collectionName]: {
            ...(get().data[collectionName] ?? existing),
            documents: documents ?? [],
            fields,
            total,
            nextCursor,
            prevCursor,
            hasNext,
            hasPrev,
            loading: false,
            error: null,
            totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
            ...stateOverrides,
          },
        },
      });
    } catch (e: any) {
      set({
        data: {
          ...get().data,
          [collectionName]: {
            ...(get().data[collectionName] ?? existing),
            loading: false,
            error: String(e),
          },
        },
      });
    }
  };

  return {
    data: {},
    reset: () => set({ data: {} }),

    fetchCollection: async (collectionName, options = {}) => {
      const collectionData =
        get().data[collectionName] ?? defaultCollectionState;
      const isNewQuery =
        collectionName !== collectionData.collectionName ||
        (options.query ?? "") !== collectionData.query;

      await executeQuery(collectionName, options, {
        collectionName,
        query: options.query ?? "",
        ...(isNewQuery ? { page: 1, cursorStack: [] } : {}),
      });
    },

    // Both now require collectionName explicitly — previously this read
    // Object.values(get().data)[0], which silently paginated whichever
    // collection happened to be first in the cache, not the one the user
    // was actually viewing.
    nextPage: async (collectionName) => {
      const collectionData = get().data[collectionName];
      if (!collectionData) return;

      const { query, nextCursor, hasNext, page, cursorStack } = collectionData;
      if (!hasNext || !nextCursor) return;

      await executeQuery(
        collectionName,
        {
          query,
          docId: nextCursor,
          direction: "next",
        },
        {
          page: page + 1,
          cursorStack: [...cursorStack, nextCursor],
        },
      );
    },

    prevPage: async (collectionName) => {
      const collectionData = get().data[collectionName];
      if (!collectionData) return;

      const { query, page, cursorStack } = collectionData;
      if (cursorStack.length === 0) return;

      const newStack = cursorStack.slice(0, -1);
      const cursorToUse = newStack[newStack.length - 1] ?? "";

      await executeQuery(
        collectionName,
        {
          query,
          docId: cursorToUse,
          direction: "", // forward-only scan, see backend fix
        },
        {
          page: Math.max(1, page - 1),
          cursorStack: newStack,
        },
      );
    },

    search: async (collectionName, query) => {
      await executeQuery(collectionName, { query }, { collectionName, query });
    },

    bulkDeleteDocuments: async (collectionName, documentIds) => {
      const existing = get().data[collectionName] ?? defaultCollectionState;
      set({
        data: {
          ...get().data,
          [collectionName]: { ...existing, loading: true, error: null },
        },
      });
      try {
        await BulkDeleteDocuments(collectionName, documentIds);
        const currentQuery = get().data[collectionName]?.query ?? "";
        await get().fetchCollection(collectionName, { query: currentQuery });
      } catch (e: any) {
        set({
          data: {
            ...get().data,
            [collectionName]: {
              ...(get().data[collectionName] ?? existing),
              error: String(e),
              loading: false,
            },
          },
        });
      }
    },
  };
});
