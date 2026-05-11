"""
Smart Sukuk RAG Chatbot — FastAPI Application
==============================================
Main entry point for the chatbot microservice.
- POST /chat — Process user messages with RAG + LLM
- POST /ingest — Trigger knowledge base re-ingestion
- GET /health — Health check endpoint
"""

import time
import uuid
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import (
    CHATBOT_HOST, CHATBOT_PORT,
    EXPRESS_BACKEND_URL, FRONTEND_URL,
    RATE_LIMIT_AUTHENTICATED, RATE_LIMIT_ANONYMOUS
)
from rag.vector_store import vector_store
from rag.retriever import retriever
from rag.ingestion import ingest_knowledge_base
from llm.client import llm_client
from templates.prompts import (
    SYSTEM_PROMPT,
    RAG_PROMPT_TEMPLATE,
    NO_CONTEXT_PROMPT,
    VISITOR_CONTEXT,
    AUTHENTICATED_CONTEXT,
    HISTORY_INSTRUCTION
)


# ============================================================
# Rate Limiter Setup
# ============================================================
def _get_rate_limit_key(request: Request) -> str:
    """Custom key function: use user_id if authenticated, else IP."""
    user_id = request.headers.get("X-User-Id")
    if user_id:
        return f"user:{user_id}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_rate_limit_key)


# ============================================================
# Lifespan — Startup/Shutdown
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load vector store on startup, cleanup on shutdown."""
    print("[Startup] Loading vector store from disk...")
    loaded = vector_store.load()
    if not loaded:
        print("[Startup] No existing index found. Run POST /ingest to build.")
    else:
        print(f"[Startup] Vector store ready with {vector_store.index.ntotal} vectors.")
    yield
    # Shutdown
    print("[Shutdown] Closing LLM client...")
    await llm_client.close()


# ============================================================
# FastAPI App
# ============================================================
app = FastAPI(
    title="Smart Sukuk Chatbot",
    description="RAG-powered chatbot for the Smart Sukuk platform",
    version="1.0.0",
    lifespan=lifespan
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow Express backend and frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[EXPRESS_BACKEND_URL, FRONTEND_URL, "http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request/Response Models
# ============================================================
class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message")
    history: list[ChatMessage] = Field(default=[], description="Previous conversation history")
    session_id: str = Field(default="", description="Session ID for history tracking")
    is_authenticated: bool = Field(default=False, description="Whether user is logged in")
    user_role: str = Field(default="", description="User's role if authenticated")
    user_context: str = Field(default="", description="Personalized user context (KYC, balance, etc.)")


class ChatResponse(BaseModel):
    response: str = Field(..., description="Assistant's response")
    session_id: str = Field(..., description="Session ID for tracking")
    sources: list[str] = Field(default=[], description="Sources used for the response")
    has_context: bool = Field(default=False, description="Whether RAG context was found")


class IngestResponse(BaseModel):
    status: str
    files_processed: int = 0
    total_chunks: int = 0
    total_characters: int = 0
    filenames: list[str] = []


class HealthResponse(BaseModel):
    status: str
    vector_store_ready: bool
    total_vectors: int
    timestamp: str


# ============================================================
# Chat History Store (In-Memory — simple persistence)
# ============================================================
# For production, replace with Redis or DB persistence
chat_histories: dict[str, list[ChatMessage]] = {}

MAX_HISTORY_LENGTH = 20  # Keep last 20 messages per session


def _get_or_create_session(session_id: str, history: list[ChatMessage]) -> tuple[str, list[ChatMessage]]:
    """Get existing session history or create new one."""
    if not session_id:
        session_id = str(uuid.uuid4())

    if session_id in chat_histories:
        # Merge incoming history with stored (client may have newer messages)
        stored = chat_histories[session_id]
        if len(history) > len(stored):
            chat_histories[session_id] = history[-MAX_HISTORY_LENGTH:]
        return session_id, chat_histories[session_id]
    else:
        chat_histories[session_id] = history[-MAX_HISTORY_LENGTH:]
        return session_id, history


def _update_session(session_id: str, user_msg: str, assistant_msg: str):
    """Append the latest exchange to session history."""
    if session_id not in chat_histories:
        chat_histories[session_id] = []

    chat_histories[session_id].append(ChatMessage(role="user", content=user_msg))
    chat_histories[session_id].append(ChatMessage(role="assistant", content=assistant_msg))

    # Trim to max length
    if len(chat_histories[session_id]) > MAX_HISTORY_LENGTH:
        chat_histories[session_id] = chat_histories[session_id][-MAX_HISTORY_LENGTH:]


# ============================================================
# Endpoints
# ============================================================
@app.post("/chat", response_model=ChatResponse)
@limiter.limit(RATE_LIMIT_AUTHENTICATED)
async def chat(request: Request, body: ChatRequest):
    """
    Process a user message through the RAG pipeline.
    
    Flow:
    1. Retrieve relevant context from vector store
    2. Build prompt with system instructions + context + history
    3. Send to LLM
    4. Return structured response
    """
    start_time = time.time()

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Get/create session
    # PRIORITY: 1. X-User-Id header (if authenticated) | 2. Body session_id | 3. New UUID
    user_id = request.headers.get("X-User-Id")
    effective_session_id = f"user_{user_id}" if user_id else body.session_id
    
    session_id, history = _get_or_create_session(effective_session_id, body.history)

    # Step 1: Retrieve relevant context
    context_str, has_context = retriever.get_context_string(body.message)

    # Step 2: Build the messages array for LLM
    messages = []

    # System prompt with auth context and personalized data
    auth_addon = AUTHENTICATED_CONTEXT if body.is_authenticated else VISITOR_CONTEXT
    
    # Inject user_context if provided
    personalized_addon = ""
    if body.user_context:
        personalized_addon = f"\n\n### USER PERSONAL DATA:\n{body.user_context}\n"
    
    system_content = SYSTEM_PROMPT + "\n\n" + auth_addon + personalized_addon
    messages.append({"role": "system", "content": system_content})

    # Add conversation history (if any)
    if history:
        history_text = "\n".join([f"{m.role}: {m.content}" for m in history[-6:]])  # Last 6 messages
        messages.append({
            "role": "system",
            "content": HISTORY_INSTRUCTION.format(history=history_text)
        })

    # User message with RAG context
    if has_context:
        user_content = RAG_PROMPT_TEMPLATE.format(
            context=context_str,
            question=body.message
        )
    else:
        user_content = NO_CONTEXT_PROMPT.format(question=body.message)

    messages.append({"role": "user", "content": user_content})

    # Step 3: Call LLM
    try:
        response_text = await llm_client.chat(messages)
    except Exception as e:
        print(f"[Chat] LLM Error: {e}")
        response_text = (
            "I apologize, but I'm experiencing a technical issue connecting to my AI backend. "
            "Please try again in a moment. If the issue persists, please contact support."
        )

    # Step 4: Update session history
    _update_session(session_id, body.message, response_text)

    # Extract sources from context
    sources = []
    if has_context:
        results = retriever.retrieve(body.message)
        sources = list(set(r.source for r in results))

    elapsed = time.time() - start_time
    print(f"[Chat] Processed in {elapsed:.2f}s | Context: {has_context} | Sources: {len(sources)}")

    return ChatResponse(
        response=response_text,
        session_id=session_id,
        sources=sources,
        has_context=has_context
    )


@app.post("/ingest", response_model=IngestResponse)
async def ingest(request: Request):
    """
    Trigger re-ingestion of the knowledge base documents.
    This rebuilds the FAISS index from the .md files in the knowledge directory.
    Should only be called when knowledge documents are updated.
    """
    try:
        result = ingest_knowledge_base()
        return IngestResponse(**result)
    except Exception as e:
        print(f"[Ingest] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        vector_store_ready=vector_store.is_ready,
        total_vectors=vector_store.index.ntotal if vector_store.index else 0,
        timestamp=datetime.utcnow().isoformat()
    )


# ============================================================
# Run with Uvicorn
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=CHATBOT_HOST,
        port=CHATBOT_PORT,
        reload=False,
        log_level="info"
    )
