import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export function useSortableTable<T extends Record<string, any>>(
  data: T[],
  defaultKey = "id",
) {
  const [sortKey, setSortKey] = useState<string>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else if (typeof av === "bigint" || typeof bv === "bigint") {
        cmp = Number(av) - Number(bv);
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  function sortIndicator(col: string): string {
    if (col !== sortKey) return " \u21d5";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  }

  return { sorted, sortKey, sortDir, toggleSort, sortIndicator };
}
