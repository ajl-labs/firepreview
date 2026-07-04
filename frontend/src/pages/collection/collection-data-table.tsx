import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnFiltersState,
  VisibilityState,
  ColumnDef,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueryInput } from "@/components/QueryInput";
import { Button } from "@/components/ui/button";
import { useCollection } from "./useCollection";
import { Spinner } from "@/components/ui/spinner";
import { CollectionDataViewDialog } from "./collection-data-view";
import { Ellipsis } from "lucide-react";

interface CollectionDataTableProps {
  collectionName: string;
}

export const CollectionDataTable: React.FC<CollectionDataTableProps> = ({
  collectionName,
}) => {
  const {
    documents = [],
    fields = [],
    fetchCollection,
    nextPage,
    prevPage,
    page,
    pageSize,
    total,
    totalPages,
    hasNext,
    hasPrev,
    loading,
    query,
    bulkDeleteDocuments,
  } = useCollection(collectionName);

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [currentDocument, setCurrentDocument] =
    React.useState<database.DocumentResult | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const viewColumn: ColumnDef<database.DocumentResult> = useMemo(
    () => ({
      id: "view",
      header: "View",
      size: 48,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation(); // don't also trigger the row's own onClick
            setCurrentDocument(row.original);
          }}
        >
          <Ellipsis className="size-4" />
        </Button>
      ),
    }),
    [],
  );

  const table = useReactTable({
    data: documents,
    columns: useMemo(
      () => [...buildCollectionTableColumns(fields), viewColumn],
      [fields, viewColumn],
    ),
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true, // paging is driven by the store, not react-table
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    getRowId: (row) => row.id,
  });

  const handleFetchData = useCallback(
    async (params?: Partial<database.QueryParams>) => {
      if (collectionName) {
        await fetchCollection(collectionName, params);
      }
    },
    [collectionName, fetchCollection],
  );

  const handleQuery = (query: string) => {
    // fetchCollection detects the query changed and resets to page 1 / clears
    // the cursor stack internally — no manual page reset needed here.
    handleFetchData({ query });
  };

  const handleDeleteSelected = async () => {
    const idsToDelete = table
      .getSelectedRowModel()
      .rows.map((row) => row.original)
      ?.map((doc) => doc.id);
    if (idsToDelete.length > 0 && collectionName) {
      await bulkDeleteDocuments(collectionName, idsToDelete);
      setRowSelection({});
    }
  };

  const handleRowClick = useCallback(
    (e: React.MouseEvent, doc: database.DocumentResult) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          'button, a, input, [role="checkbox"], [data-no-row-click]',
        )
      ) {
        return;
      }
      setCurrentDocument(doc);
    },
    [],
  );

  useEffect(() => {
    handleFetchData();
  }, [collectionName]);

  if (loading && documents?.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="size-8" />
      </div>
    );
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

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
          {table.getSelectedRowModel().rows?.length > 0 && (
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
        <Table loading={loading && !documents.length && query === ""}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={
                        header.column.id === "view"
                          ? "sticky right-0 z-10 bg-background shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)]"
                          : undefined
                      }
                    >
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
            {table.getRowModel()?.rows?.length ? (
              table.getRowModel()?.rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(e) => handleRowClick(e, row.original)}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "view"
                          ? "sticky right-0 z-10 bg-background shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)]"
                          : "max-w-100 overflow-hidden text-ellipsis whitespace-nowrap"
                      }
                    >
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
                  colSpan={table.getAllColumns().length || 1}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          {total > 0 ? (
            <>
              {start} - {end} of {total}
              {totalPages > 0 && (
                <span className="ml-2">
                  (page {page} of {totalPages})
                </span>
              )}
            </>
          ) : (
            "No results"
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={!hasPrev || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={!hasNext || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
