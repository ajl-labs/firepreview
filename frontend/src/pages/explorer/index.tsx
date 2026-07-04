import { useEffect } from "react";
import { useExplorerStore } from "@/store/explorer";
import { ExplorerTable } from "./components/explorer-table";
import { useNavigate } from "react-router";
import { PageContainer } from "@/components/PageContainer";

export const ExplorerPage = () => {
  const navigate = useNavigate();
  const { fetchCollections, collections, loading, error } = useExplorerStore(
    (s) => s,
  );

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <PageContainer title="Explorer" subtitle="Collections">
      {error && <p className="text-red-500">{error}</p>}
      <ExplorerTable
        data={collections}
        onSelect={(collection) => {
          navigate(`/collection/${encodeURIComponent(collection.id)}`);
        }}
        loading={loading}
      />
    </PageContainer>
  );
};
