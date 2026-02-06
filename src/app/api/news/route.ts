import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NewsQuerySchema } from '@/types/api'

const NEWSAPI_KEY = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY

// Cache duration: 30 minutes for news
const CACHE_DURATION_MS = 30 * 60 * 1000

interface NewsApiArticle {
  source: { id: string | null; name: string }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

interface NewsApiResponse {
  status: string
  totalResults: number
  articles: NewsApiArticle[]
}

interface NewsDbItem {
  id: string
  title: string
  description: string | null
  url: string
  imageUrl: string | null
  source: string
  category: string
  author: string | null
  publishedAt: Date
  sentiment: number | null
}

// Map our categories to NewsAPI categories
const CATEGORY_MAP: Record<string, string> = {
  'ai': 'technology',
  'tech': 'technology', 
  'science': 'science'
}

export async function GET(request: NextRequest) {
  try {
    // Check API key
    if (!NEWSAPI_KEY) {
      return NextResponse.json(
        { error: 'NewsAPI key not configured' },
        { status: 500 }
      )
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'tech'
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    
    const validationResult = NewsQuerySchema.safeParse({ category, limit })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const validatedCategory = validationResult.data.category
    const validatedLimit = validationResult.data.limit

    // Check cache - look for recent news in this category
    const cachedNews = await prisma.news.findMany({
      where: {
        category: CATEGORY_MAP[validatedCategory] || validatedCategory,
        createdAt: {
          gte: new Date(Date.now() - CACHE_DURATION_MS)
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: validatedLimit
    })

    // If we have enough cached articles, return them
    if (cachedNews.length >= validatedLimit * 0.5) {
      await trackApiUsage('news', 'newsapi', true)
      
      return NextResponse.json({
        items: cachedNews.map((news: NewsDbItem) => ({
          id: news.id,
          title: news.title,
          description: news.description,
          url: news.url,
          imageUrl: news.imageUrl,
          source: news.source,
          category: news.category,
          author: news.author,
          publishedAt: news.publishedAt.toISOString(),
          sentiment: news.sentiment,
        })),
        cached: true,
        total: cachedNews.length
      })
    }

    // Fetch from NewsAPI
    const apiUrl = new URL('https://newsapi.org/v2/top-headlines')
    apiUrl.searchParams.set('category', CATEGORY_MAP[validatedCategory] || 'technology')
    apiUrl.searchParams.set('language', 'en')
    apiUrl.searchParams.set('pageSize', validatedLimit.toString())
    apiUrl.searchParams.set('apiKey', NEWSAPI_KEY)

    // Add AI-specific query if category is 'ai'
    if (validatedCategory === 'ai') {
      apiUrl.searchParams.set('q', 'artificial intelligence OR AI OR machine learning')
    }

    const response = await fetch(apiUrl.toString(), {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`)
    }

    const data: NewsApiResponse = await response.json()

    if (data.status !== 'ok') {
      throw new Error('NewsAPI returned error status')
    }

    // Save articles to database
    const savedArticles = await Promise.all(
      data.articles.slice(0, validatedLimit).map(async (article) => {
        // Skip if article already exists (check by URL)
        const existing = await prisma.news.findFirst({
          where: { url: article.url }
        })

        if (existing) {
          return existing
        }

        return prisma.news.create({
          data: {
            title: article.title,
            description: article.description,
            url: article.url,
            imageUrl: article.urlToImage,
            source: article.source.name,
            category: CATEGORY_MAP[validatedCategory] || 'technology',
            author: article.author,
            publishedAt: new Date(article.publishedAt),
            sentiment: null, // Could be calculated later
            summary: null,
            trending: false,
            viewCount: 0,
          }
        })
      })
    )

    // Track API usage
    await trackApiUsage('news', 'newsapi', false)

    return NextResponse.json({
      items: savedArticles.map((news: NewsDbItem) => ({
        id: news.id,
        title: news.title,
        description: news.description,
        url: news.url,
        imageUrl: news.imageUrl,
        source: news.source,
        category: news.category,
        author: news.author,
        publishedAt: news.publishedAt.toISOString(),
        sentiment: news.sentiment,
      })),
      cached: false,
      total: savedArticles.length
    })

  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news data' },
      { status: 500 }
    )
  }
}

async function trackApiUsage(
  endpoint: string,
  provider: string,
  cached: boolean
) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.apiUsage.upsert({
      where: {
        endpoint_provider_date: {
          endpoint: cached ? `${endpoint}-cache` : endpoint,
          provider,
          date: today
        }
      },
      update: {
        requests: { increment: 1 }
      },
      create: {
        endpoint: cached ? `${endpoint}-cache` : endpoint,
        provider,
        date: today,
        requests: 1
      }
    })
  } catch (e) {
    console.error('Failed to track API usage:', e)
  }
}
