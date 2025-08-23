import * as React from "react"
import { Table } from "@tanstack/react-table"
import { Input } from "./input"
import { Button } from "./button"
import { Plus, X, Search } from "lucide-react"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTableViewOptions } from "./data-table-view-options"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey: string
  filterOptions?: {
    label: string
    value: string
    options: { label: string; value: string }[]
  }[]
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  filterOptions = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between gap-4 p-0">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative min-w-[280px] max-w-[400px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={`Search ${searchKey}...`}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="pl-10 h-10 w-full text-sm bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
          />
        </div>
        {filterOptions.map((option) => (
          <div key={option.value}>
            <DataTableFacetedFilter
              column={table.getColumn(option.value)}
              title={option.label}
              options={option.options}
            />
          </div>
        ))}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-10 px-3 text-sm hover:bg-muted/80 hover:text-foreground transition-colors duration-200"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
