import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import type { NewsItem } from "@/types";

interface NewsFeedProps {
  items: NewsItem[];
  isLoading: boolean;
}

export function NewsFeed({ items, isLoading }: NewsFeedProps) {
  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Latest News</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          No news available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Latest News</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="group">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg p-2 -mx-2 transition-colors hover:bg-white/5"
              >
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-[#46b7c6] transition-colors">
                  {item.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{item.source}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
