"""
Configuration module for the Smart Sukuk RAG Chatbot.
Uses Pydantic BaseSettings for robust environment variable management.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# ============================================================
# Paths
# ============================================================
BASE_DIR = Path(__file__).parent
KNOWLEDGE_DIR = BASE_DIR / "knowledge"
VECTOR_STORE_DIR = BASE_DIR / "vector_store"

class Settings(BaseSettings):
    """
    Application settings using Pydantic BaseSettings.
    Automatically fetches from environment variables or .env file.
    """
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Embedding Model
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Ollama Cloud LLM
    # Note: Use /v1 suffix for OpenAI-compatible endpoint to avoid 404
    OLLAMA_BASE_URL: str = "https://ollama.com/v1"
    OLLAMA_MODEL: str = "gpt-oss:20b"
    OLLAMA_API_TOKEN: str = ""

    # LLM Parameters
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 1024

    # RAG Pipeline
    RETRIEVAL_SCORE_THRESHOLD: float = 0.3
    RETRIEVAL_TOP_K: int = 5
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64

    # Rate Limiting
    RATE_LIMIT_AUTHENTICATED: str = "30/minute"
    RATE_LIMIT_ANONYMOUS: str = "10/minute"

    # Server
    CHATBOT_HOST: str = "0.0.0.0"
    CHATBOT_PORT: int = 8001

    # CORS
    EXPRESS_BACKEND_URL: str = "http://localhost:5000"
    FRONTEND_URL: str = "http://localhost:3000"


# Initialize settings
settings = Settings()

# ============================================================
# Compatibility Exports
# ============================================================
# We export these individually to avoid breaking existing imports in other modules.
EMBEDDING_MODEL_NAME = settings.EMBEDDING_MODEL_NAME
OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL
OLLAMA_MODEL = settings.OLLAMA_MODEL
OLLAMA_API_TOKEN = settings.OLLAMA_API_TOKEN
LLM_TEMPERATURE = settings.LLM_TEMPERATURE
LLM_MAX_TOKENS = settings.LLM_MAX_TOKENS
RETRIEVAL_SCORE_THRESHOLD = settings.RETRIEVAL_SCORE_THRESHOLD
RETRIEVAL_TOP_K = settings.RETRIEVAL_TOP_K
CHUNK_SIZE = settings.CHUNK_SIZE
CHUNK_OVERLAP = settings.CHUNK_OVERLAP
RATE_LIMIT_AUTHENTICATED = settings.RATE_LIMIT_AUTHENTICATED
RATE_LIMIT_ANONYMOUS = settings.RATE_LIMIT_ANONYMOUS
CHATBOT_HOST = settings.CHATBOT_HOST
CHATBOT_PORT = settings.CHATBOT_PORT
EXPRESS_BACKEND_URL = settings.EXPRESS_BACKEND_URL
FRONTEND_URL = settings.FRONTEND_URL
