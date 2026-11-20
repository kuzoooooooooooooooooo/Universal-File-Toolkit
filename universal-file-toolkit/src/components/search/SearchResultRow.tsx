"use client";

import { ToolIcon } from "@/components/ui/tool-icon";
import { categories } from "@/config/categories";
import type { ToolDefinition } from "@/types/tool";

interface Props {
  tool: ToolDefinition;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}

export function SearchResultRow({ tool, active, onSelect, onHover }: Props) {
  const cat = categories[tool.category];
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
        active ? "bg-secondary" : "bg-transparent"
      }`}
    >
      <span style={{ color: cat.color }}>
        <ToolIcon name={tool.icon} className="h-4 w-4" />
      </span>
      <span className="flex-1">
        <span className="block text-sm text-foreground">{tool.name}</span>
        <span className="block text-xs text-muted-foreground">{tool.description}</span>
      </span>
      <span className="text-[10px] uppercase text-muted-foreground">
        {tool.outputFormats.join("/")}
      </span>
    </button>
  );
}
