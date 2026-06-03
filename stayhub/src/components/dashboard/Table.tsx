import React from "react";
import { useTranslation } from "../../contexts/LocaleContext";

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
  emptyMessage,
  keyExtractor,
  isLoading = false,
  skeletonRows = 5,
}: TableProps<T>) {
  const { t } = useTranslation();
  const resolvedEmpty = emptyMessage ?? t("common.noData");
  return (
    <div className="table-glass overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse">
        <thead>
          <tr className="border-b border-slate-100/80 bg-slate-50/70">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 ${col.className || ""}`}
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
                className="border-b border-slate-100/80 bg-white/50"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={`skeleton-col-${colIndex}`}
                    className={`px-5 py-3.5 ${col.className || ""}`}
                  >
                    <div className="h-5 w-full animate-pulse rounded-lg bg-slate-200/80"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-16 text-center text-sm font-medium text-slate-400"
              >
                {resolvedEmpty}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr
                key={keyExtractor ? keyExtractor(item, rowIndex) : rowIndex}
                className="group border-b border-slate-100/80 bg-white/40 transition-colors last:border-b-0 hover:bg-brand-light/30"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-5 py-3.5 text-sm text-slate-700 ${col.className || ""}`}
                  >
                    {col.render
                      ? col.render(item, rowIndex)
                      : col.accessor
                        ? String((item as Record<string, unknown>)[col.accessor as string] ?? "")
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
