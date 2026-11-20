"use client";

import { useMemo, useState } from "react";
import { searchTools } from "@/lib/registry/tool-registry";

export function useToolSearch() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchTools(query).slice(0, 8), [query]);

  const setQuerySafe = (q: string) => {
    setQuery(q);
    setActive(0);
  };

  return { query, setQuery: setQuerySafe, results, active, setActive };
}
