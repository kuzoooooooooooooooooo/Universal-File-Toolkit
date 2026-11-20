import type { Metadata } from "next";
import { categoryList } from "@/config/categories";
import { getToolsByCategory } from "@/lib/registry/tool-registry";
import { ToolCard } from "@/components/tool/ToolCard";

export const metadata: Metadata = {
  title: "All Tools",
  description: "Every available file tool, grouped by category.",
};

export default function AllToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">All tools</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every tool runs locally in your browser. No uploads, ever.
      </p>
      {categoryList.map((cat) => {
        const tools = getToolsByCategory(cat.id);
        if (tools.length === 0) return null;
        return (
          <section key={cat.id} className="mt-12">
            <h2 className="text-xl font-semibold text-foreground">{cat.name}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
