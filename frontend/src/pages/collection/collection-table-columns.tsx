import { ColumnDef } from "@tanstack/react-table";
import { database } from "../../../wailsjs/go/models";
import { Checkbox } from "@/components/ui/checkbox";

export const staticColumns: ColumnDef<database.DocumentResult>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

export const buildCollectionTableColumns = (
  fields: database.CollectionDocFieldInfo[] = [],
): ColumnDef<database.DocumentResult>[] => {
  const fieldColumns: ColumnDef<database.DocumentResult>[] = fields.map(
    (field) => ({
      id: field.name,
      header: field.name,
      accessorFn: (row) => {
        const value = row.fields?.[field.name];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      },
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue() as string}</span>
      ),
      enableSorting: true,
      enableHiding: true,
    }),
  );
  return [...staticColumns, ...fieldColumns];
};
