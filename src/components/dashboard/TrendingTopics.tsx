import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { TrendingTopic } from "@/types";

interface TrendingTopicsProps {
  topics: TrendingTopic[];
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  const getTrendIcon = (trend: string) => {
    const isPositive = trend.startsWith("+");
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-green-500" : "text-red-500";
    return <Icon className={`h-4 w-4 ${colorClass}`} />;
  };

  const getTrendColor = (trend: string) => {
    if (trend.startsWith("+")) return "text-green-500";
    if (trend.startsWith("-")) return "text-red-500";
    return "text-muted-foreground";
  };

  if (topics.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Trending Now</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          No trending topics available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Trending Now</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {topics.map((topic, index) => (
            <li
              key={topic.id}
              className="flex items-center justify-between rounded-lg p-2 -mx-2 transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-5">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{topic.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(topic.trend)}
                <span className={`text-sm font-medium ${getTrendColor(topic.trend)}`}>
                  {topic.trend}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
