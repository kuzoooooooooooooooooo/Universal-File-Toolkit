import Link from "next/link";
import { ToolIcon } from "@/components/ui/tool-icon";
import { categories } from "@/config/categories";
import type { ToolDefinition } from "@/types/tool";

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const cat = categories[tool.category];
  return (
    <Link
      href={`/tools/${tool.id}`}
      className="group rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/50 hover:bg-secondary/40"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}
        >
          <ToolIcon name={tool.icon} className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
          {cat.name}
        </span>
      </div>
      <h3 className="mt-4 font-semibold text-foreground transition-colors group-hover:text-primary">
        {tool.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
    </Link>
  );
}
