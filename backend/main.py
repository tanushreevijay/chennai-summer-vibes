import os
import json
import random
from datetime import date, datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq, RateLimitError, APIError

load_dotenv()

app = FastAPI(title="Chennai Summer Vibes", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

CATEGORIES = [
    "exploring hidden gems",
    "cooking & food",
    "outdoor adventures",
    "arts & crafts",
    "wellness & self-care",
    "local food spots to try",
    "cultural experiences",
    "beach & water activities",
    "photography walks",
    "reading & learning",
    "gardening & plants",
    "DIY projects",
    "music & entertainment",
    "volunteering & community",
    "night-time activities",
]

SUGGESTION_PROMPT = """You are a fun, creative lifestyle assistant who knows Chennai (India) inside out.
Generate ONE unique, specific, and creative suggestion for something fun to do in Chennai during summer.

Category hint: {category}

The suggestion should be:
- Specific to Chennai (mention real places, neighborhoods, streets, or local things when relevant)
- Practical and doable in a single day
- Consider the hot Chennai summer weather (suggest indoor/evening/early morning activities, or ways to beat the heat)
- Fun, quirky, and not generic — surprise the user!
- Include a brief "why it's cool" reason

Respond ONLY in this exact JSON format:
{{
  "title": "A short catchy title (max 8 words)",
  "description": "A 2-3 sentence description of what to do, where to go, and any tips",
  "category": "the category name",
  "emoji": "one relevant emoji",
  "vibe": "one word describing the vibe (e.g., chill, adventurous, cozy, creative, yummy)",
  "best_time": "suggested time of day (e.g., early morning, evening, night, anytime)"
}}
"""


class Suggestion(BaseModel):
    title: str
    description: str
    category: str
    emoji: str
    vibe: str
    best_time: str
    date: str


daily_cache: dict[str, Suggestion] = {}


async def generate_suggestion(category: str | None = None) -> Suggestion:
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY not configured. Please set it in your .env file.",
        )

    client = Groq(api_key=GROQ_API_KEY)

    if category is None:
        category = random.choice(CATEGORIES)

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a fun, creative lifestyle assistant. Respond only with valid JSON.",
                },
                {
                    "role": "user",
                    "content": SUGGESTION_PROMPT.format(category=category),
                },
            ],
            temperature=1.2,
            max_completion_tokens=500,
            response_format={"type": "json_object"},
        )
    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="AI rate limit reached. Please wait a minute and try again.",
        )
    except APIError as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI API error: {e}",
        )

    try:
        text = response.choices[0].message.content.strip()
        data = json.loads(text)
        return Suggestion(
            title=data["title"],
            description=data["description"],
            category=data["category"],
            emoji=data["emoji"],
            vibe=data["vibe"],
            best_time=data["best_time"],
            date=date.today().isoformat(),
        )
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response: {e}",
        )


@app.get("/")
async def root():
    return {
        "message": "Chennai Summer Vibes API",
        "version": "1.0.0",
        "endpoints": {
            "/suggestion/today": "Get today's daily suggestion",
            "/suggestion/new": "Get a fresh random suggestion",
            "/categories": "List all categories",
            "/health": "Health check",
        },
    }


@app.get("/suggestion/today", response_model=Suggestion)
async def get_today_suggestion():
    today = date.today().isoformat()
    if today in daily_cache:
        return daily_cache[today]

    suggestion = await generate_suggestion()
    daily_cache[today] = suggestion
    return suggestion


@app.get("/suggestion/new", response_model=Suggestion)
async def get_new_suggestion(
    category: str | None = Query(None, description="Optional category filter"),
):
    return await generate_suggestion(category=category)


@app.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "groq_configured": bool(GROQ_API_KEY),
    }
