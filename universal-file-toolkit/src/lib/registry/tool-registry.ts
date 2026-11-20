import { ToolDefinition, ToolCategory } from "@/types/tool";
import { imageTools } from "./tools/image-tools";
import { pdfTools } from "./tools/pdf-tools";
import { archiveTools } from "./tools/archive-tools";
import { documentTools } from "./tools/document-tools";
import { devtoolsTools } from "./tools/devtools-tools";

const allTools: ToolDefinition[] = [
  ...imageTools,
  ...pdfTools,
  ...archiveTools,
  ...documentTools,
  ...devtoolsTools,
];

export function getAllTools(): ToolDefinition[] {
  return allTools;
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return allTools.filter((t) => t.category === category);
}

export function getToolById(id: string): ToolDefinition | undefined {
  return allTools.find((t) => t.id === id);
}

export function searchTools(query: string): ToolDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return allTools.filter((tool) => {
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q)) ||
      tool.inputFormats.some((f) => f.toLowerCase().includes(q)) ||
      tool.outputFormats.some((f) => f.toLowerCase().includes(q))
    );
  });
}

export function getSupportedTools(): ToolDefinition[] {
  return allTools.filter((t) => t.supported);
}

export function getMatchingTools(ext: string): ToolDefinition[] {
  const supported = getSupportedTools();
  const exact = supported.filter((t) => t.inputFormats.includes(ext));
  if (exact.length > 0) return exact;
  return supported.filter((t) => t.inputFormats.includes("*"));
}
