import { z } from 'zod'

// Weather types
export const WeatherQuerySchema = z.object({
  city: z.string().min(1).max(100),
})

export const WeatherResponseSchema = z.object({
  location: z.string(),
  temp: z.number(),
  condition: z.string(),
  icon: z.string(),
  fetchedAt: z.string().datetime(),
})

export type WeatherResponse = z.infer<typeof WeatherResponseSchema>

// News types
export const NewsQuerySchema = z.object({
  category: z.enum(['ai', 'tech', 'science']),
  limit: z.coerce.number().min(1).max(50).default(10),
})

export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  source: z.string(),
  category: z.string(),
  author: z.string().nullable(),
  publishedAt: z.string().datetime(),
  sentiment: z.number().nullable(),
})

export const NewsResponseSchema = z.object({
  items: z.array(NewsItemSchema),
})

export type NewsItem = z.infer<typeof NewsItemSchema>
export type NewsResponse = z.infer<typeof NewsResponseSchema>

// Trending types
export const TrendingQuerySchema = z.object({
  topic: z.enum(['artificial-intelligence', 'machine-learning', 'technology']).optional(),
})

export const TrendingTopicSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  category: z.string(),
  rank: z.number(),
  volume: z.number().nullable(),
  growth: z.number().nullable(),
  platform: z.string(),
  timestamp: z.string().datetime(),
})

export const TrendingResponseSchema = z.object({
  topics: z.array(TrendingTopicSchema),
})

export type TrendingTopic = z.infer<typeof TrendingTopicSchema>
export type TrendingResponse = z.infer<typeof TrendingResponseSchema>

// Error response
export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>
