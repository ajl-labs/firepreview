import { useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { CollectionDataTable } from "./collection-data-table";
import { PageContainer } from "@/components/PageContainer";

export const CollectionPage = () => {
  const { collectionName } = useParams<{ collectionName: string }>();

  return (
    <PageContainer
      title={decodeURIComponent(collectionName ?? "")}
      subtitle="Collection"
      backTo="/"
    >
      <CollectionDataTable
        collectionName={decodeURIComponent(collectionName ?? "")}
      />
    </PageContainer>
  );
};
