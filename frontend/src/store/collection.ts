import { create } from "zustand";
import { GetCollection, BulkDeleteDocuments } from "../../wailsjs/go/main/App";
import { database } from "../../wailsjs/go/models";

const PAGE_SIZE = 50; // Default page size

interface CollectionStore {
  documents: database.DocumentResult[];
  total: number;
  loading: boolean;
  error: string | null;
  fields: database.FieldInfo[];

  // pagination
  collectionName: string; // remembered so next/prev don't need it passed again
  query: string; // remembered filter/search term for next/prev
  page: number;
  pageSize: number;
  totalPages: number;
  cursorStack: string[]; // docIds of pages visited, for Prev
  nextCursor: string;
  prevCursor: string;
  hasNext: boolean;
  hasPrev: boolean;

  fetchCollection: (
    collectionName: string,
    options?: Partial<database.QueryParams>,
  ) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  reset: () => void;
  bulkDeleteDocuments: (
    collectionName: string,
    documentIds: string[],
  ) => Promise<void>;
}

const defaultState = {
  documents: [] as database.DocumentResult[],
  total: 0,
  loading: false,
  error: null as string | null,
  fields: [] as database.FieldInfo[],

  collectionName: "",
  query: "",
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 0,
  cursorStack: [] as string[],
  nextCursor: "",
  prevCursor: "",
  hasNext: false,
  hasPrev: false,
};

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  ...defaultState,

  reset: () => set(defaultState),

  // Base fetch — always treated as loading a fresh page (page 1, cleared cursor
  // stack) unless a docId/direction is explicitly passed in `options`. Use
  // nextPage/prevPage for cursor navigation instead of calling this directly
  // mid-pagination.
  fetchCollection: async (collectionName, options = {}) => {
    const { pageSize } = get();
    const isNewQuery =
      collectionName !== get().collectionName ||
      (options.query ?? "") !== get().query;

    set({ loading: true, error: null });
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
        ...options,
      });

      set({
        documents: documents ?? [],
        fields,
        total,
        nextCursor,
        prevCursor,
        hasNext,
        hasPrev,
        loading: false,
        collectionName,
        query: options.query ?? "",
        totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
        // fresh query resets paging position; cursor-driven calls (next/prev)
        // set page/cursorStack themselves after this resolves
        ...(isNewQuery ? { page: 1, cursorStack: [] } : {}),
      });
    } catch (e: any) {
      set({ error: String(e), loading: false });
    }
  },

  nextPage: async () => {
    const {
      collectionName,
      query,
      nextCursor,
      hasNext,
      pageSize,
      page,
      cursorStack,
    } = get();
    if (!hasNext || !nextCursor || !collectionName) return;

    set({ loading: true, error: null });
    try {
      const {
        documents = [],
        fields,
        total = 0,
        nextCursor: newNextCursor = "",
        prevCursor: newPrevCursor = "",
        hasNext: newHasNext = false,
        hasPrev: newHasPrev = false,
      } = await GetCollection(collectionName, {
        limit: pageSize,
        query,
        docId: nextCursor,
        direction: "next",
      });

      set({
        documents: documents ?? [],
        fields,
        total,
        nextCursor: newNextCursor,
        prevCursor: newPrevCursor,
        hasNext: newHasNext,
        hasPrev: newHasPrev,
        loading: false,
        page: page + 1,
        cursorStack: [...cursorStack, nextCursor],
        totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
      });
    } catch (e: any) {
      set({ error: String(e), loading: false });
    }
  },

  prevPage: async () => {
    const { collectionName, query, pageSize, page, cursorStack } = get();
    if (cursorStack.length === 0 || !collectionName) return;

    const newStack = cursorStack.slice(0, -1);
    const cursorToUse = newStack[newStack.length - 1] ?? ""; // "" => first page

    set({ loading: true, error: null });
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
        query,
        docId: cursorToUse,
        direction: cursorToUse ? "prev" : "",
      });

      set({
        documents: documents ?? [],
        fields,
        total,
        nextCursor,
        prevCursor,
        hasNext,
        hasPrev,
        loading: false,
        page: Math.max(1, page - 1),
        cursorStack: newStack,
        totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
      });
    } catch (e: any) {
      set({ error: String(e), loading: false });
    }
  },

  bulkDeleteDocuments: async (collectionName, documentIds) => {
    set({ loading: true, error: null });
    try {
      await BulkDeleteDocuments(collectionName, documentIds);
      // refetch current page fresh after delete (counts/cursors may have shifted)
      await get().fetchCollection(collectionName, { query: get().query });
    } catch (e: any) {
      set({ error: String(e), loading: false });
    }
  },
}));
