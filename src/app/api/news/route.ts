import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const NEWSAPI_KEY = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY

const NewsQuerySchema = z.object({
  category: z.enum(['ai', 'tech', 'science']).default('tech'),
  limit: z.number().min(1).max(20).default(10),
})

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

const CATEGORY_MAP: Record<string, string> = {
  'ai': 'technology',
  'tech': 'technology', 
  'science': 'science'
}

export async function GET(request: NextRequest) {
  try {
    if (!NEWSAPI_KEY) {
      return NextResponse.json(
        { error: 'NewsAPI key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'tech'
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    
    const validationResult = NewsQuerySchema.safeParse({ category, limit })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    const validatedCategory = validationResult.data.category
    const validatedLimit = validationResult.data.limit

    // Fetch from NewsAPI (no database cache)
    const apiUrl = new URL('https://newsapi.org/v2/top-headlines')
    apiUrl.searchParams.set('category', CATEGORY_MAP[validatedCategory] || 'technology')
    apiUrl.searchParams.set('pageSize', validatedLimit.toString())
    apiUrl.searchParams.set('apiKey', NEWSAPI_KEY)
    apiUrl.searchParams.set('language', 'en')

    const response = await fetch(apiUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 1800 } // Cache 30 min
    })

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`)
    }

    const data: NewsApiResponse = await response.json()

    const items = data.articles.map((article, index) => ({
      id: `news-${index}`,
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.urlToImage,
      source: article.source.name,
      category: validatedCategory,
      author: article.author,
      publishedAt: article.publishedAt,
    }))

    return NextResponse.json({ items })

  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
