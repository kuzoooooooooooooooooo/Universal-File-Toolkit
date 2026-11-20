import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories } from "@/config/categories";
import { getToolsByCategory } from "@/lib/registry/tool-registry";
import { ToolCard } from "@/components/tool/ToolCard";
import type { ToolCategory } from "@/types/tool";

export function generateStaticParams() {
  return Object.keys(categories).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = categories[slug as ToolCategory];
  if (!cat) return { title: "Category not found" };
  return { title: cat.name, description: cat.description };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = categories[slug as ToolCategory];
  if (!cat) notFound();
  const tools = getToolsByCategory(cat.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">{cat.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{cat.description}</p>
      {tools.length === 0 ? (
        <p className="mt-10 rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          Tools in this category are coming in the next phase. The registry is
          data-driven: new tools appear here automatically once implemented.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
