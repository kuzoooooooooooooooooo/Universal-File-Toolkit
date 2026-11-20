"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useToolSearch } from "@/hooks/useToolSearch";
import { SearchResultRow } from "@/components/search/SearchResultRow";

export function SearchBar() {
  const router = useRouter();
  const { query, setQuery, results, active, setActive } = useToolSearch();

  const go = (index: number) => {
    const tool = results[index];
    if (!tool) return;
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
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-primary/60">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search tools or formats (try: png, webp, compress)..."
          className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
          Ctrl K
        </kbd>
      </div>
      {query && (
        <div className="absolute inset-x-0 top-14 z-40 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No tools found for &quot;{query}&quot;
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {results.map((tool, i) => (
                <SearchResultRow
                  key={tool.id}
                  tool={tool}
                  active={i === active}
                  onSelect={() => go(i)}
                  onHover={() => setActive(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
