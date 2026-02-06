import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TrendingQuerySchema } from '@/types/api'

// Cache duration: 15 minutes for trending data
const CACHE_DURATION_MS = 15 * 60 * 1000

interface RedditPost {
  data: {
    title: string
    subreddit: string
    ups: number
    num_comments: number
    created_utc: number
    permalink: string
    url: string
  }
}

interface RedditResponse {
  data: {
    children: RedditPost[]
  }
}

interface TrendingDbItem {
  id: string
  keyword: string
  category: string
  rank: number
  volume: number | null
  growth: number | null
  platform: string
  timestamp: Date
}

// Map topics to subreddits
const TOPIC_SUBREDDITS: Record<string, string[]> = {
  'artificial-intelligence': ['artificial', 'MachineLearning', 'singularity'],
  'machine-learning': ['MachineLearning', 'LocalLLaMA', 'MLOps'],
  'technology': ['technology', 'Futurology', 'gadgets']
}

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  'artificial': 'artificial-intelligence',
  'MachineLearning': 'artificial-intelligence',
  'singularity': 'artificial-intelligence',
  'LocalLLaMA': 'artificial-intelligence',
  'MLOps': 'artificial-intelligence',
  'technology': 'technology',
  'Futurology': 'technology',
  'gadgets': 'technology'
}

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic') || 'artificial-intelligence'
    
    const validationResult = TrendingQuerySchema.safeParse({ topic })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid topic parameter', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const validatedTopic = validationResult.data.topic || 'artificial-intelligence'

    // Check cache
    const cachedTrending = await prisma.trending.findMany({
      where: {
        category: validatedTopic,
        timestamp: {
          gte: new Date(Date.now() - CACHE_DURATION_MS)
        },
        platform: 'reddit'
      },
      orderBy: { rank: 'asc' },
      take: 10
    })

    if (cachedTrending.length >= 5) {
      return NextResponse.json({
        topics: cachedTrending.map((t: TrendingDbItem) => ({
          id: t.id,
          keyword: t.keyword,
          category: t.category,
          rank: t.rank,
          volume: t.volume,
          growth: t.growth,
          platform: t.platform,
          timestamp: t.timestamp.toISOString(),
        })),
        cached: true
      })
    }

    // Determine which subreddits to fetch
    const subreddits = TOPIC_SUBREDDITS[validatedTopic] || ['artificial', 'technology']
    
    // Fetch from Reddit API (no auth required for public endpoints)
    const allPosts: RedditPost['data'][] = []
    
    for (const subreddit of subreddits) {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'IntelliDash/1.0 (Dashboard App)'
            },
            next: { revalidate: 300 }
          }
        )

        if (!response.ok) {
          console.warn(`Failed to fetch from r/${subreddit}: ${response.status}`)
          continue
        }

        const data: RedditResponse = await response.json()
        allPosts.push(...data.data.children.map(child => child.data))
      } catch (e) {
        console.warn(`Error fetching from r/${subreddit}:`, e)
      }
    }

    if (allPosts.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch trending data from Reddit' },
        { status: 503 }
      )
    }

    // Sort by engagement (upvotes + comments) and dedupe
    const seenTitles = new Set<string>()
    const uniquePosts = allPosts
      .filter(post => {
        const normalized = post.title.toLowerCase().trim()
        if (seenTitles.has(normalized)) return false
        seenTitles.add(normalized)
        return true
      })
      .sort((a, b) => (b.ups + b.num_comments * 2) - (a.ups + a.num_comments * 2))
      .slice(0, 15)

    // Clear old cache for this category
    await prisma.trending.deleteMany({
      where: {
        category: validatedTopic,
        platform: 'reddit'
      }
    })

    // Save to database
    const savedTopics = await Promise.all(
      uniquePosts.map(async (post, index) => {
        const subreddit = post.subreddit
        const category = CATEGORY_MAP[subreddit] || validatedTopic
        
        // Calculate engagement score as "volume"
        const volume = post.ups + post.num_comments
        
        // Estimate growth based on recency (newer posts have higher growth potential)
        const hoursAgo = (Date.now() / 1000 - post.created_utc) / 3600
        const growth = hoursAgo < 1 ? 100 : Math.max(0, 100 - hoursAgo * 5)

        return prisma.trending.create({
          data: {
            keyword: post.title.substring(0, 200), // Truncate long titles
            category: category,
            rank: index + 1,
            volume: volume,
            growth: Math.round(growth * 10) / 10,
            platform: 'reddit',
            region: 'global',
            relatedTopics: JSON.stringify([subreddit, post.permalink]),
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + CACHE_DURATION_MS)
          }
        })
      })
    )

    return NextResponse.json({
      topics: savedTopics.map((t: TrendingDbItem) => ({
        id: t.id,
        keyword: t.keyword,
        category: t.category,
        rank: t.rank,
        volume: t.volume,
        growth: t.growth,
        platform: t.platform,
        timestamp: t.timestamp.toISOString(),
      })),
      cached: false
    })

  } catch (error) {
    console.error('Trending API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending data' },
      { status: 500 }
    )
  }
}
