"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useToolSearch } from "@/hooks/useToolSearch";
import { SearchResultRow } from "./SearchResultRow";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function CommandPalette({ open, setOpen }: Props) {
  const router = useRouter();
  const { query, setQuery, results, active, setActive } = useToolSearch();

  if (!open) return null;

  const go = (index: number) => {
    const tool = results[index];
    if (!tool) return;
    setOpen(false);
    setQuery("");
    router.push(`/tools/${tool.id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(active + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(active - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(active);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="mx-auto mt-24 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tools, formats, keywords..."
            className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        {query && (
          <div className="max-h-80 overflow-y-auto py-1">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No tools found for &quot;{query}&quot;
              </p>
            ) : (
              results.map((tool, i) => (
                <SearchResultRow
                  key={tool.id}
                  tool={tool}
                  active={i === active}
                  onSelect={() => go(i)}
                  onHover={() => setActive(i)}
                />
              ))
            )}
          </div>
        )}
        <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          ↑↓ navigate · Enter open · Esc close
        </div>
      </div>
    </div>
  );
}
