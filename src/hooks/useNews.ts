import { useQuery } from '@tanstack/react-query'
import type { NewsResponse } from '@/types/api'

const NEWS_CACHE_TIME = 10 * 60 * 1000 // 10 minutes

interface UseNewsOptions {
  category?: 'ai' | 'tech' | 'science'
  limit?: number
}

async function fetchNews(options: UseNewsOptions): Promise<NewsResponse> {
  const { category = 'ai', limit = 10 } = options
  const params = new URLSearchParams()
  params.set('category', category)
  params.set('limit', limit.toString())
  
  const response = await fetch(`/api/news?${params.toString()}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch news data')
  }
  
  return response.json()
}

export function useNews(options: UseNewsOptions = {}) {
  const { category = 'ai', limit = 10 } = options
  
  return useQuery<NewsResponse, Error>({
    queryKey: ['news', category, limit],
    queryFn: () => fetchNews({ category, limit }),
    staleTime: NEWS_CACHE_TIME,
    gcTime: NEWS_CACHE_TIME * 2,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
