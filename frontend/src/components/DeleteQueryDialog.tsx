import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ExecuteDeleteQuery,
  PreviewDeleteQuery,
} from "../../wailsjs/go/main/App";
import { database } from "../../wailsjs/go/models";

const formatShare = (count: number, total: number) => {
  if (total === 0) return "0%";
  const percent = (count / total) * 100;
  // avoid showing 0% or 100% when it isn't exactly that
  if (percent > 0 && percent < 1) return "<1%";
  if (percent > 99 && percent < 100) return ">99%";
  return `${Math.round(percent)}%`;
};

export const isDeleteStatement = (query: string) =>
  /^\s*delete\s/i.test(query);

interface DeleteQueryDialogProps {
  collectionName: string;
  statement: string | null;
  onClose: () => void;
  onDeleted: (deletedCount: number) => void;
}

export const DeleteQueryDialog: React.FC<DeleteQueryDialogProps> = ({
  collectionName,
  statement,
  onClose,
  onDeleted,
}) => {
  const [preview, setPreview] = useState<database.DeletePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(null);
    setError(null);
    if (!statement) return;

    let cancelled = false;
    setLoading(true);
    PreviewDeleteQuery(collectionName, statement)
      .then((result) => !cancelled && setPreview(result))
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [collectionName, statement]);

  const handleConfirm = async () => {
    if (!statement || !preview) return;
    setDeleting(true);
    setError(null);
    try {
      const deletedCount = await ExecuteDeleteQuery(collectionName, statement);
      onDeleted(deletedCount);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleting) onClose();
  };

  return (
    <Dialog open={!!statement} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!deleting}>
        <DialogHeader>
          <DialogTitle>Delete documents</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Spinner /> Counting matching documents...
          </div>
        )}

        {preview && (
          <div className="flex flex-col gap-2">
            <p>
              You are about to delete{" "}
              <span className="font-semibold">{preview.count}</span>{" "}
              {preview.count === 1 ? "document" : "documents"} from{" "}
              <span className="font-mono font-semibold">
                {preview.collection}
              </span>{" "}
              ({formatShare(preview.count, preview.total)} of {preview.total}).
            </p>
            <code className="rounded-md bg-muted px-2 py-1 text-xs break-all">
              WHERE {preview.where}
            </code>
          </div>
        )}

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!preview || preview.count === 0 || deleting}
          >
            {deleting && <Spinner />}
            Delete {preview?.count ?? ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
