import React, { useCallback, useEffect } from "react";
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
import { QueryClause, QueryInput } from "@/components/QueryInput";

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
  } = useCollectionStore((s) => s);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [currentPageIndex, setCurrentPageIndex] = React.useState(0);
  const [currentDocument, setCurrentDocument] =
    React.useState<database.DocumentResult | null>(null);

  const table = useReactTable({
    data: documents,
    columns: buildCollectionTableColumns(fields),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    state: {
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex: currentPageIndex,
        pageSize,
      },
    },
  });

  const handleFetchData = useCallback(
    async (pageToken: string = "") => {
      if (collectionName) {
        await fetchCollection(decodeURIComponent(collectionName), pageToken);
      }
    },
    [collectionName],
  );

  const handleNextPage = () => {
    if (hasMore) {
      handleFetchData(nextPageToken);
      setCurrentPageIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      // For previous page, we need to fetch the collection again without a page token
      // handleFetchData();
      setCurrentPageIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleQuery = (clauses: QueryClause[]) => {
    console.log(clauses);
    // e.g. [
    //   { field: 'status', operator: '==', value: 'active', join: 'AND' },
    //   { field: 'age', operator: '>=', value: '18' }
    // ]
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
      <div className="flex items-center py-4 gap-2">
        <div className="w-2/3">
          <QueryInput onQuery={handleQuery} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
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
