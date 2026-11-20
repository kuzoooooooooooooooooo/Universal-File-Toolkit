import Link from "next/link";
import { ToolIcon } from "@/components/ui/tool-icon";
import { categoryList } from "@/config/categories";
import { getToolsByCategory } from "@/lib/registry/tool-registry";

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-foreground">Categories</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categoryList.map((cat) => {
          const count = getToolsByCategory(cat.id).length;
          return (
            <Link
              key={cat.id}
              href={`/categories/${cat.id}`}
              className="group rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/50 hover:bg-secondary/40"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}
              >
                <ToolIcon name={cat.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground transition-colors group-hover:text-primary">
                {cat.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {count} tool{count === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
