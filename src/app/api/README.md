# IntelliDash API Routes

## Endpoints

### Weather API
```
GET /api/weather?city={city_name}
```

**Parameters:**
- `city` (required): City name (e.g., "Warsaw", "New York")

**Response:**
```json
{
  "location": "Warsaw",
  "temp": 22.5,
  "condition": "Clear",
  "icon": "https://openweathermap.org/img/wn/01d@2x.png",
  "fetchedAt": "2025-02-06T09:30:00.000Z",
  "cached": false
}
```

**Features:**
- 10-minute caching via database
- Saves data to Weather model
- Tracks API usage

---

### News API
```
GET /api/news?category={category}&limit={limit}
```

**Parameters:**
- `category` (required): One of `ai`, `tech`, `science`
- `limit` (optional): Number of articles (1-50, default: 10)

**Response:**
```json
{
  "items": [
    {
      "id": "...",
      "title": "Article Title",
      "description": "Article description...",
      "url": "https://...",
      "imageUrl": "https://...",
      "source": "TechCrunch",
      "category": "technology",
      "author": "John Doe",
      "publishedAt": "2025-02-06T08:00:00.000Z",
      "sentiment": null
    }
  ],
  "cached": false,
  "total": 10
}
```

**Features:**
- 30-minute caching via database
- Saves articles to News model
- Deduplicates by URL
- Tracks API usage

---

### Trending API
```
GET /api/trending?topic={topic}
```

**Parameters:**
- `topic` (optional): One of `artificial-intelligence`, `machine-learning`, `technology`

**Response:**
```json
{
  "topics": [
    {
      "id": "...",
      "keyword": "OpenAI releases new model",
      "category": "artificial-intelligence",
      "rank": 1,
      "volume": 15420,
      "growth": 95.5,
      "platform": "reddit",
      "timestamp": "2025-02-06T09:30:00.000Z"
    }
  ],
  "cached": false
}
```

**Features:**
- 15-minute caching via database
- Fetches from Reddit (no API key required)
- Ranks by engagement (upvotes + comments)
- Multiple subreddits per topic

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# API Keys
OPENWEATHER_API_KEY="your_key"
NEWSAPI_KEY="your_key"
```

## Rate Limiting

Default rate limits (in-memory):
- 60 requests per minute per IP

Headers included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description"
}
```

Status codes:
- `400`: Invalid parameters
- `404`: Resource not found (e.g., city)
- `500`: Server error
- `503`: Service unavailable (external API issue)
