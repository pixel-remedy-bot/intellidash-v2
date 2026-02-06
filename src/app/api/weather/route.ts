import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { WeatherQuerySchema } from '@/types/api'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

// Cache duration: 10 minutes for weather data
const CACHE_DURATION_MS = 10 * 60 * 1000

interface OpenWeatherResponse {
  coord: { lon: number; lat: number }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  wind: { speed: number; deg: number }
  clouds: { all: number }
  visibility: number
  sys: { country: string; sunrise: number; sunset: number }
  name: string
}

export async function GET(request: NextRequest) {
  try {
    // Check API key
    if (!OPENWEATHER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenWeather API key not configured' },
        { status: 500 }
      )
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    
    const validationResult = WeatherQuerySchema.safeParse({ city })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid city parameter', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const validatedCity = validationResult.data.city

    // Check cache - look for recent weather data for this location
    const cachedWeather = await prisma.weather.findFirst({
      where: {
        location: { equals: validatedCity, mode: 'insensitive' },
        lastUpdated: {
          gte: new Date(Date.now() - CACHE_DURATION_MS)
        }
      },
      orderBy: { lastUpdated: 'desc' }
    })

    if (cachedWeather) {
      // Track API usage (cache hit)
      await trackApiUsage('weather', 'openweather', true)
      
      return NextResponse.json({
        location: cachedWeather.location,
        temp: cachedWeather.temperature,
        condition: cachedWeather.condition,
        icon: cachedWeather.icon,
        fetchedAt: cachedWeather.lastUpdated.toISOString(),
        cached: true
      })
    }

    // Fetch from OpenWeatherMap API
    const apiUrl = new URL('https://api.openweathermap.org/data/2.5/weather')
    apiUrl.searchParams.set('q', validatedCity)
    apiUrl.searchParams.set('appid', OPENWEATHER_API_KEY)
    apiUrl.searchParams.set('units', 'metric')

    const response = await fetch(apiUrl.toString(), {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'City not found' },
          { status: 404 }
        )
      }
      throw new Error(`OpenWeather API error: ${response.status} ${response.statusText}`)
    }

    const data: OpenWeatherResponse = await response.json()

    // Save to database
    const weatherRecord = await prisma.weather.create({
      data: {
        location: data.name,
        country: data.sys.country,
        latitude: data.coord.lat,
        longitude: data.coord.lon,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        visibility: data.visibility,
        condition: data.weather[0]?.main || 'Unknown',
        description: data.weather[0]?.description,
        icon: `https://openweathermap.org/img/wn/${data.weather[0]?.icon}@2x.png`,
        lastUpdated: new Date(),
      }
    })

    // Track API usage (actual call)
    await trackApiUsage('weather', 'openweather', false)

    return NextResponse.json({
      location: weatherRecord.location,
      temp: weatherRecord.temperature,
      condition: weatherRecord.condition,
      icon: weatherRecord.icon,
      fetchedAt: weatherRecord.lastUpdated.toISOString(),
      cached: false
    })

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
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
    // Non-critical, just log
    console.error('Failed to track API usage:', e)
  }
}
