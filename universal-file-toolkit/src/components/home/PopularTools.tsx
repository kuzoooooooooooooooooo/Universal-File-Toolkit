import { getSupportedTools } from "@/lib/registry/tool-registry";
import { ToolCard } from "@/components/tool/ToolCard";

export function PopularTools() {
  const tools = getSupportedTools().slice(0, 8);
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-foreground">Popular tools</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
