import Link from "next/link";
import { Folder } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { slugify } from "@/lib/utils";

interface CategorySummary {
  category: string | null;
  count: number;
}

export function CategoryGrid({ categories, baseHref }: { categories: CategorySummary[]; baseHref: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((c) => (
        <Link key={c.category ?? "uncategorized"} href={`${baseHref}/${slugify(c.category ?? "uncategorized")}`}>
          <Card className="transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                <Folder className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.category ?? "Uncategorized"}</p>
                <p className="text-xs text-muted-foreground">
                  {c.count} article{c.count === 1 ? "" : "s"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
