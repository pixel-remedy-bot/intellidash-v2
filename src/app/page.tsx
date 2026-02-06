'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { WeatherWidget } from '@/components/dashboard/WeatherWidget'
import { NewsFeed } from '@/components/dashboard/NewsFeed'
import { TrendingTopics } from '@/components/dashboard/TrendingTopics'
import { useWeather, useNews, useTrending } from '@/hooks'
import type { WeatherData, NewsItem, TrendingTopic } from '@/types'
import type { NewsResponse, TrendingResponse } from '@/types/api'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Helper to format relative time
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Map API weather response to component format
function mapWeatherData(apiData: Awaited<ReturnType<typeof useWeather>>['data']): WeatherData | null {
  if (!apiData) return null
  return {
    location: apiData.location,
    temp: apiData.temp,
    condition: apiData.condition,
    icon: apiData.icon,
  }
}

// Map API news response to component format
function mapNewsData(apiData: NewsResponse | undefined): NewsItem[] {
  if (!apiData?.items) return []
  return apiData.items.map(item => ({
    id: item.id,
    title: item.title,
    source: item.source,
    time: formatTimeAgo(item.publishedAt),
    url: item.url,
  }))
}

// Map API trending response to component format
function mapTrendingData(apiData: TrendingResponse | undefined): TrendingTopic[] {
  if (!apiData?.topics) return []
  return apiData.topics.map(topic => ({
    id: topic.id,
    name: topic.keyword.length > 50 ? topic.keyword.slice(0, 50) + '...' : topic.keyword,
    trend: topic.growth ? `+${topic.growth.toFixed(1)}%` : '0%',
  }))
}

export default function Home() {
  const { 
    data: weatherData, 
    isLoading: weatherLoading, 
    error: weatherError
  } = useWeather('Warsaw')
  
  const { 
    data: newsData, 
    isLoading: newsLoading, 
    error: newsError 
  } = useNews({ category: 'ai', limit: 10 })
  
  const { 
    data: trendingData, 
    error: trendingError 
  } = useTrending('artificial-intelligence')

  const weather = mapWeatherData(weatherData)
  const news = mapNewsData(newsData)
  const trending = mapTrendingData(trendingData)

  const hasError = weatherError || newsError || trendingError

  return (
    <DashboardLayout>
      {/* Error Alert */}
      {hasError && (
        <div className="col-span-1 md:col-span-2 mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading data</AlertTitle>
            <AlertDescription>
              {weatherError && `Weather: ${weatherError.message}. `}
              {newsError && `News: ${newsError.message}. `}
              {trendingError && `Trending: ${trendingError.message}`}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Weather Widget */}
      <WeatherWidget 
        data={weather} 
        isLoading={weatherLoading} 
      />

      {/* Trending Topics */}
      <TrendingTopics 
        topics={trending} 
      />

      {/* News Feed - Full Width */}
      <div className="col-span-1 md:col-span-2">
        <NewsFeed 
          items={news} 
          isLoading={newsLoading} 
        />
      </div>
    </DashboardLayout>
  )
}
