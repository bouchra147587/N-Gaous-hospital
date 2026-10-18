from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """A single message in the chat history."""

    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    locale: Literal["ar", "fr", "en"] = "ar"
    history: list[ChatMessage] = Field(default_factory=list, max_length=60)


class ChatResponse(BaseModel):
    reply: str
    # "db"  -> answered directly from the hospital database (fast, exact)
    # "ai"  -> answered by the Gemini model using database context
    source: Literal["db", "ai", "system"] = "db"
