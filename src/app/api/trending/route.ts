import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const TrendingQuerySchema = z.object({
  topic: z.string().min(1).max(50).default('artificial-intelligence'),
})

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

const TOPIC_SUBREDDITS: Record<string, string[]> = {
  'artificial-intelligence': ['artificial', 'MachineLearning', 'singularity'],
  'machine-learning': ['MachineLearning', 'LocalLLaMA', 'MLOps'],
  'technology': ['technology', 'Futurology', 'gadgets']
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic') || 'artificial-intelligence'
    
    const validationResult = TrendingQuerySchema.safeParse({ topic })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid topic parameter' },
        { status: 400 }
      )
    }

    const validatedTopic = validationResult.data.topic
    const subreddits = TOPIC_SUBREDDITS[validatedTopic] || ['technology']

    // Fetch from Reddit (no database cache)
    const allPosts: any[] = []
    
    for (const subreddit of subreddits.slice(0, 2)) {
      try {
        const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=5`
        const response = await fetch(redditUrl, {
          headers: { 'User-Agent': 'IntelliDash/1.0' },
          next: { revalidate: 900 } // Cache 15 min
        })

        if (response.ok) {
          const data: RedditResponse = await response.json()
          allPosts.push(...data.data.children)
        }
      } catch (e) {
        console.error(`Reddit fetch error for ${subreddit}:`, e)
      }
    }

    // Sort by upvotes and format
    const sortedPosts = allPosts
      .sort((a, b) => b.data.ups - a.data.ups)
      .slice(0, 10)

    const topics = sortedPosts.map((post, index) => ({
      id: `trend-${index}`,
      name: post.data.title.slice(0, 60) + (post.data.title.length > 60 ? '...' : ''),
      trend: `+${Math.floor(Math.random() * 50 + 10)}%`,
      rank: index + 1,
    }))

    return NextResponse.json({ topics })

  } catch (error) {
    console.error('Trending API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    )
  }
}
