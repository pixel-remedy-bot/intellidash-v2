import { useQuery } from '@tanstack/react-query'
import type { TrendingResponse } from '@/types/api'

const TRENDING_CACHE_TIME = 15 * 60 * 1000 // 15 minutes

type TrendingTopic = 'artificial-intelligence' | 'machine-learning' | 'technology'

async function fetchTrending(topic: TrendingTopic): Promise<TrendingResponse> {
  const response = await fetch(`/api/trending?topic=${encodeURIComponent(topic)}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch trending data')
  }
  
  return response.json()
}

export function useTrending(topic: TrendingTopic = 'artificial-intelligence') {
  return useQuery<TrendingResponse, Error>({
    queryKey: ['trending', topic],
    queryFn: () => fetchTrending(topic),
    staleTime: TRENDING_CACHE_TIME,
    gcTime: TRENDING_CACHE_TIME * 2,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
