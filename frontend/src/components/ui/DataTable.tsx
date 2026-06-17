import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  searchPlaceholder?: string;
  showExport?: boolean;
  onExport?: () => void;
  filterContent?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  searchPlaceholder = "Search...",
  showExport = true,
  onExport,
  filterContent,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = getNestedValue(row, col.key as string);
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = getNestedValue(a, sortKey);
        const bVal = getNestedValue(b, sortKey);
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, search, sortKey, sortDir, columns]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    
    // Default CSV export
    const headers = columns.map(c => c.header).join(",");
    const csvData = data.map(row => {
      return columns.map(col => {
        const val = getNestedValue(row, col.key as string);
        const strVal = String(val ?? "").replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(",");
    }).join("\n");
    
    const blob = new Blob([`${headers}\n${csvData}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border border-border mr-2 hidden sm:flex">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")} title="Grid View">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")} title="List View">
              <List className="w-4 h-4" />
            </Button>
          </div>
          {filterContent && (
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="sm" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          )}
          {showExport && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      <AnimatePresence>
        {showFilters && filterContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/50"
          >
            <div className="p-4 bg-muted/10">
              {filterContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table / Grid */}
      {viewMode === "list" ? (
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.className || ""}`}
                >
                  {col.sortable !== false ? (
                    <button
                      onClick={() => handleSort(String(col.key))}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      {col.header}
                      {getSortIcon(String(col.key))}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginatedData.map((row, index) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="table-row-hover"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-4 text-sm ${col.className || ""}`}
                  >
                    {col.render
                      ? col.render(getNestedValue(row, col.key as string), row)
                      : String(getNestedValue(row, col.key as string) ?? "")}
                  </td>
                ))}
                {(onView || onEdit || onDelete) && (
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(row)}
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(row)}
                          className="h-8 w-8 rounded-lg hover:bg-warning/10 hover:text-warning"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(row)}
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/10">
          {paginatedData.map((row, index) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="glass-card p-4 flex flex-col gap-4 relative hover:shadow-md transition-shadow bg-card"
            >
              <div className="flex-1 space-y-4">
                {columns.map((col) => {
                  const val = getNestedValue(row, col.key as string);
                  const rendered = col.render ? col.render(val, row) : String(val ?? "");
                  return (
                    <div key={String(col.key)} className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{col.header}</span>
                      <div className="text-sm font-medium">{rendered}</div>
                    </div>
                  );
                })}
              </div>
              
              {(onView || onEdit || onDelete) && (
                <div className="pt-3 border-t border-border/50 flex justify-end gap-1 mt-2">
                  {onView && (
                    <Button variant="ghost" size="icon" onClick={() => onView(row)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(row)} className="h-8 w-8 rounded-lg hover:bg-warning/10 hover:text-warning">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" onClick={() => onDelete(row)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          {paginatedData.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>
            of {filteredData.length} {filteredData.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-4 text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}
