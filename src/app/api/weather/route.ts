import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

const WeatherQuerySchema = z.object({
  city: z.string().min(1).max(100),
})

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
    if (!OPENWEATHER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenWeather API key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    
    const validationResult = WeatherQuerySchema.safeParse({ city })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid city parameter' },
        { status: 400 }
      )
    }

    const validatedCity = validationResult.data.city

    // Fetch from OpenWeatherMap API (no database cache)
    const apiUrl = new URL('https://api.openweathermap.org/data/2.5/weather')
    apiUrl.searchParams.set('q', validatedCity)
    apiUrl.searchParams.set('appid', OPENWEATHER_API_KEY)
    apiUrl.searchParams.set('units', 'metric')

    const response = await fetch(apiUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 600 } // Cache 10 min
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'City not found' },
          { status: 404 }
        )
      }
      throw new Error(`OpenWeather API error: ${response.status}`)
    }

    const data: OpenWeatherResponse = await response.json()

    return NextResponse.json({
      location: data.name,
      temp: Math.round(data.main.temp),
      condition: data.weather[0]?.main || 'Unknown',
      icon: `https://openweathermap.org/img/wn/${data.weather[0]?.icon}@2x.png`,
      fetchedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
