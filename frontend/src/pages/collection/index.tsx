import { useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { CollectionDataTable } from "./collection-data-table";

export const CollectionPage = () => {
  const { collectionName } = useParams<{ collectionName: string }>();

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title={decodeURIComponent(collectionName ?? "")}
        subtitle="Collection"
        backTo="/"
      />
      {/* document table goes here next */}
      <CollectionDataTable collectionName={collectionName} />
    </div>
  );
};
