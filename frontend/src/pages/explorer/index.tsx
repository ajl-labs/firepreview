import { ExplorerTable } from "./components/explorer-table";
import { useNavigate } from "react-router";
import { PageContainer } from "@/components/PageContainer";

export const ExplorerPage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="Explorer" subtitle="Collections">
      <ExplorerTable
        onSelect={(collection) => {
          navigate(`/collection/${encodeURIComponent(collection.id)}`);
        }}
      />
    </PageContainer>
  );
};
