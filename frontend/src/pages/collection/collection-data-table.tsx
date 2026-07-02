import React, { useCallback, useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { buildCollectionTableColumns } from "./collection-table-columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { database } from "../../../wailsjs/go/models";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueryInput } from "@/components/QueryInput";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { useCollectionStore } from "@/store/collection";
import { Spinner } from "@/components/ui/spinner";
import { CollectionDataViewDialog } from "./collection-data-view";
import { CodeBlock } from "@/components/CodeBlock";

interface CollectionDataTableProps {
  collectionName?: string;
}

export const CollectionDataTable: React.FC<CollectionDataTableProps> = ({
  collectionName,
}) => {
  const {
    documents,
    fields,
    fetchCollection,
    hasMore,
    nextPageToken,
    loading,
    pageSize,
    bulkDeleteDocuments,
  } = useCollectionStore((s) => s);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [currentPageIndex, setCurrentPageIndex] = React.useState(0);
  const [currentDocument, setCurrentDocument] =
    React.useState<database.DocumentResult | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const table = useReactTable({
    data: documents,
    columns: buildCollectionTableColumns(fields),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: currentPageIndex,
        pageSize,
      },
    },
    getRowId: (row) => row.id,
  });

  const handleFetchData = useCallback(
    async (params?: Partial<database.QueryParams>) => {
      if (collectionName) {
        await fetchCollection(decodeURIComponent(collectionName), params);
      }
    },
    [collectionName],
  );

  const handleNextPage = () => {
    if (hasMore) {
      handleFetchData({ pageToken: nextPageToken });
      setCurrentPageIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      // For previous page, we need to fetch the collection again without a page token
      handleFetchData({ pageToken: "" });
      setCurrentPageIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleQuery = (query: string) => {
    handleFetchData({ query, pageToken: "" });
  };

  const handleDeleteSelected = async () => {
    const idsToDelete = table
      .getSelectedRowModel()
      .rows.map((row) => row.original)
      ?.map((doc) => doc.id);
    if (idsToDelete.length > 0 && collectionName) {
      await bulkDeleteDocuments(
        decodeURIComponent(collectionName),
        idsToDelete,
      );
    }
    handleFetchData({ pageToken: "" });
  };

  useEffect(() => {
    handleFetchData();
  }, [collectionName]);

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full h-screen">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div>
      <CollectionDataViewDialog
        document={currentDocument}
        onClose={() => setCurrentDocument(null)}
      />
      <QueryInput onQuery={handleQuery} fields={fields} />
      <div className="flex items-center justify-between py-4 gap-2">
        {/* Left side: Put any title, search bar, or leave it empty */}
        <div className="flex items-center gap-2"></div>

        {/* Right side: Placed cleanly at the end */}
        <div className="flex items-center gap-2">
          {Object.values(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => setCurrentDocument(row.original)}
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
                  colSpan={documents.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        {currentPageIndex !== 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
        )}
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={loading}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};
