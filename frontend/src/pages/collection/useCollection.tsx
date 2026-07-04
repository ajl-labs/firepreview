import { useCallback } from "react";
import { useCollectionStore, defaultCollectionState } from "@/store/collection";
import { useShallow } from "zustand/react/shallow";
/**
 * Reads the state for a single collection out of the multi-collection store,
 * and returns nextPage/prevPage already bound to that collection name so
 * call sites don't need to pass it every time.
 *
 * Using useShallow here is load-bearing, not decorative: `s.data[key] ?? defaultCollectionState`
 * returns a fresh object on every store update if we don't shallow-compare it,
 * which causes this component (and every consumer of this hook) to re-render
 * on unrelated store changes — e.g. editing collection B re-renders a
 * component only interested in collection A.
 */
export function useCollection(collectionName?: string) {
  const key = collectionName ?? "";

  const state = useCollectionStore(
    useShallow((s) => s.data[key] ?? defaultCollectionState),
  );

  // Actions are stable references from the store (defined once in create()),
  // so subscribing to them individually is cheap and never causes re-renders
  // on its own.
  const fetchCollection = useCollectionStore((s) => s.fetchCollection);
  const bulkDeleteDocuments = useCollectionStore((s) => s.bulkDeleteDocuments);
  const search = useCollectionStore((s) => s.search);
  const nextPageRaw = useCollectionStore((s) => s.nextPage);
  const prevPageRaw = useCollectionStore((s) => s.prevPage);

  const nextPage = useCallback(() => nextPageRaw(key), [nextPageRaw, key]);
  const prevPage = useCallback(() => prevPageRaw(key), [prevPageRaw, key]);

  return {
    ...state,
    fetchCollection,
    bulkDeleteDocuments,
    search,
    nextPage,
    prevPage,
  };
}
