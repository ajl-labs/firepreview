import { ColumnDef } from "@tanstack/react-table";
import { database } from "../../../../wailsjs/go/models";
export const explorerTableColumns: ColumnDef<database.CollectionInfo>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.index + 1}
      </span>
    ),
    enableSorting: false,
  },

  {
    accessorKey: "name",
    header: "Collection Name",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.id}</span>
    ),
    enableSorting: true,
  },

  {
    accessorKey: "path",
    header: "Document Path",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.original.path}
      </span>
    ),
  },
];
