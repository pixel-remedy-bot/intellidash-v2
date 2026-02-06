import { useQuery } from '@tanstack/react-query'
import type { WeatherResponse } from '@/types/api'

const WEATHER_CACHE_TIME = 5 * 60 * 1000 // 5 minutes

async function fetchWeather(city: string): Promise<WeatherResponse> {
  const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch weather data')
  }
  
  return response.json()
}

export function useWeather(city: string) {
  return useQuery<WeatherResponse, Error>({
    queryKey: ['weather', city],
    queryFn: () => fetchWeather(city),
    staleTime: WEATHER_CACHE_TIME,
    gcTime: WEATHER_CACHE_TIME * 2,
    enabled: !!city,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
