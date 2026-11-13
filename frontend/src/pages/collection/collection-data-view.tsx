import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { database } from "../../../wailsjs/go/models";
import { UpdateDocument } from "../../../wailsjs/go/main/App";
import { CodeBlock } from "@/components/CodeBlock";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

type Fields = Record<string, unknown>;

interface FieldChanges {
  changed: Fields;
  removed: string[];
}

const isPlainObject = (value: unknown): value is Fields =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Compare top-level fields so only what the user touched is sent to Firestore.
const diffFields = (original: Fields, edited: Fields): FieldChanges => {
  const changed: Fields = {};
  for (const [field, value] of Object.entries(edited)) {
    if (JSON.stringify(value) !== JSON.stringify(original[field])) {
      changed[field] = value;
    }
  }
  const removed = Object.keys(original).filter((field) => !(field in edited));
  return { changed, removed };
};

interface CollectionDataViewDialogProps {
  collectionName: string;
  document?: database.DocumentResult | null;
  onClose?: () => void;
  onSaved?: (document: database.DocumentResult) => void;
}

export const CollectionDataViewDialog: React.FC<
  CollectionDataViewDialogProps
> = ({ collectionName, document, onClose, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // leave edit mode whenever a different document is opened
  useEffect(() => {
    setEditing(false);
    setError(null);
  }, [document?.id]);

  const startEditing = () => {
    setDraft(JSON.stringify(document?.fields ?? {}, null, 2));
    setError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!document) return;

    let edited: unknown;
    try {
      edited = JSON.parse(draft);
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
      return;
    }
    if (!isPlainObject(edited)) {
      setError("The document must be a JSON object.");
      return;
    }

    const { changed, removed } = diffFields(document.fields ?? {}, edited);
    if (Object.keys(changed).length === 0 && removed.length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await UpdateDocument(
        collectionName,
        document.id,
        JSON.stringify(changed),
        removed,
      );
      setEditing(false);
      onSaved?.(updated);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !saving) onClose?.();
  };

  return (
    <Sheet open={!!document} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[50vw] sm:max-w-[50vw] lg:max-w-[40vw] flex flex-col">
        <SheetHeader className="flex-row items-center gap-2 pr-12">
          <SheetTitle className="font-mono text-sm flex-1 truncate">
            {document?.id}
          </SheetTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil /> Edit
            </Button>
          )}
        </SheetHeader>

        <div className="mt-2 flex-1 overflow-y-auto">
          {editing ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              disabled={saving}
              aria-invalid={!!error}
              className="h-full font-mono text-xs field-sizing-fixed resize-none"
            />
          ) : (
            <CodeBlock value={document?.fields} />
          )}
        </div>

        {editing && (
          <div className="flex flex-col gap-2 border-t p-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Spinner />}
                Save
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
