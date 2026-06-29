import { useEffect } from "react";
import { useExplorerStore } from "@/store/explorer";
import { ExplorerTable } from "./components/explorer-table";
import { useNavigate } from "react-router";

export const ExplorerPage = () => {
  const navigate = useNavigate();
  const { fetchCollections, collections, loading, error } = useExplorerStore(
    (s) => s,
  );

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <ExplorerTable
        data={collections}
        onSelect={(collection) => {
          navigate(`/collection/${encodeURIComponent(collection.id)}`);
        }}
      />
    </div>
  );
};
