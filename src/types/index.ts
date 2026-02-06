export interface WeatherData {
  location: string;
  temp: number;
  condition: string;
  icon: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
}

export interface TrendingTopic {
  id: string;
  name: string;
  trend: string;
}
