"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";

interface SearchContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const SearchContext = createContext<SearchContextValue>({
  open: false,
  setOpen: () => {},
});

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette open={open} setOpen={setOpen} />
    </SearchContext.Provider>
  );
}
