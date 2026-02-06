import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import type { WeatherData } from "@/types";

interface WeatherWidgetProps {
  data: WeatherData | null;
  isLoading: boolean;
}

const weatherIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "sunny": Sun,
  "clear": Sun,
  "cloudy": Cloud,
  "clouds": Cloud,
  "rain": CloudRain,
  "snow": CloudSnow,
  "thunderstorm": CloudLightning,
  "storm": CloudLightning,
};

export function WeatherWidget({ data, isLoading }: WeatherWidgetProps) {
  const getWeatherIcon = (condition: string) => {
    const normalizedCondition = condition.toLowerCase();
    const Icon = weatherIcons[normalizedCondition] || Cloud;
    return <Icon className="h-12 w-12 text-[#46b7c6]" />;
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          No weather data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Weather</span>
          <span className="text-sm font-normal text-muted-foreground">{data.location}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {getWeatherIcon(data.condition)}
          <div>
            <div className="text-4xl font-bold">{data.temp}°C</div>
            <div className="text-sm text-muted-foreground capitalize">{data.condition}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
