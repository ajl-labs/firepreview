import { useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { database } from "../../../../wailsjs/go/models";
import { explorerTableColumns } from "./explorer-table-columns";
import { Button } from "@/components/ui/button";
import { useExplorerStore } from "@/store/explorer";
import { useShallow } from "zustand/react/shallow";

interface ExplorerTableProps {
  onSelect: (collection: database.CollectionInfo) => void;
}

export const ExplorerTable = ({ onSelect }: ExplorerTableProps) => {
  const {
    fetchCollections,
    collections: data,
    loading,
    error,
    pageIndex,
    pageSize,
    setPagination,
  } = useExplorerStore(
    useShallow((s) => ({
      fetchCollections: s.fetchCollections,
      collections: s.collections,
      loading: s.loading,
      error: s.error,
      pageIndex: s.pageIndex,
      pageSize: s.pageSize,
      setPagination: s.setPagination,
    })),
  );

  const table = useReactTable({
    data,
    columns: explorerTableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      if (setPagination) {
        setPagination(
          typeof updater === "function"
            ? updater({ pageIndex, pageSize })
            : updater,
        );
      }
    },
    state: {
      pagination: { pageIndex, pageSize },
    },
  });

  useEffect(() => {
    fetchCollections();
  }, []);
  return (
    <div>
      {error && <p className="text-red-500">{error}</p>}
      <div className="overflow-hidden rounded-md border">
        <Table loading={loading}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={explorerTableColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No collections found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
