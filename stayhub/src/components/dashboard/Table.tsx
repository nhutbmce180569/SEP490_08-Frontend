import React from "react";

export interface Column<T> {
  header: React.ReactNode;
  accessor?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => React.Key;
  isLoading?: boolean;
  skeletonRows?: number;
}

export function Table<T>({
  data,
  columns,
  emptyMessage = "No data available.",
  keyExtractor,
  isLoading = false,
  skeletonRows = 5,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto bg-white border-b border-slate-100">
      <table className="w-full min-w-[680px] border-collapse">
        <thead>
          <tr className="border-b border-solid border-slate-100 bg-slate-50/60">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr
                key={`skeleton-row-${rowIndex}`}
                className="border-b border-solid border-slate-100 bg-white"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={`skeleton-col-${colIndex}`}
                    className={`px-5 py-3.5 ${col.className || ""}`}
                  >
                    <div className="h-5 w-full animate-pulse rounded-md bg-slate-200"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-16 text-center text-sm text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr
                key={keyExtractor ? keyExtractor(item, rowIndex) : rowIndex}
                className="group transition-colors hover:bg-slate-50/80 border-b border-solid border-slate-100"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-5 py-3.5 ${col.className || ""}`}
                  >
                    {col.render
                      ? col.render(item, rowIndex)
                      : col.accessor
                        ? (item[col.accessor] as unknown as React.ReactNode)
                        : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
