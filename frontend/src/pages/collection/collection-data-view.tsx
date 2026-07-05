import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { database } from "../../../wailsjs/go/models";
import { CodeBlock } from "@/components/CodeBlock";

interface CollectionDataViewDialogProps {
  document?: database.DocumentResult | null;
  onClose?: () => void;
}

export const CollectionDataViewDialog: React.FC<
  CollectionDataViewDialogProps
> = ({ document, onClose }) => {
  return (
    <Sheet open={!!document} onOpenChange={onClose}>
      <SheetContent className="w-[50vw] sm:max-w-[50vw] lg:max-w-[40vw] flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">{document?.id}</SheetTitle>
        </SheetHeader>
        <div className="mt-2 flex-1 overflow-y-auto">
          <CodeBlock value={document?.fields} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
