"""
Ollama Cloud LLM client.
Uses OpenAI-compatible /v1/chat/completions format with Bearer token auth.
Connection pooling via httpx.AsyncClient for low latency.
"""

import httpx
from config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_API_TOKEN, LLM_TEMPERATURE, LLM_MAX_TOKENS


class LLMClient:
    """Async HTTP client for Ollama Cloud with connection pooling."""

    def __init__(self):
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Lazy-initialize the async client with connection pooling."""
        if self._client is None or self._client.is_closed:
            headers = {
                "Content-Type": "application/json",
            }
            if OLLAMA_API_TOKEN:
                headers["Authorization"] = f"Bearer {OLLAMA_API_TOKEN}"

            self._client = httpx.AsyncClient(
                base_url=OLLAMA_BASE_URL,
                headers=headers,
                timeout=httpx.Timeout(60.0, connect=10.0),  # 60s total, 10s connect
                limits=httpx.Limits(
                    max_connections=10,
                    max_keepalive_connections=5
                )
            )
        return self._client

    async def chat(
        self,
        messages: list[dict],
        model: str = OLLAMA_MODEL,
        temperature: float = LLM_TEMPERATURE,
        max_tokens: int = LLM_MAX_TOKENS
    ) -> str:
        """
        Send a chat completion request to Ollama Cloud.

        Args:
            messages: List of {"role": "system"|"user"|"assistant", "content": str}
            model: Model name to use.
            temperature: Sampling temperature (0.1 for factual responses).
            max_tokens: Maximum tokens in response.

        Returns:
            The assistant's response text.

        Raises:
            httpx.HTTPStatusError: If the API returns an error status.
            Exception: For network or parsing errors.
        """
        client = await self._get_client()

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }

        try:
            response = await client.post("/chat/completions", json=payload)
            response.raise_for_status()

            data = response.json()

            # OpenAI-compatible response format
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]

            # Fallback for slightly different formats
            if "message" in data:
                return data["message"].get("content", "")

            return "I apologize, but I received an unexpected response format. Please try again."

        except httpx.HTTPStatusError as e:
            print(f"[LLMClient] HTTP Error {e.response.status_code}: {e.response.text}")
            raise
        except httpx.TimeoutException:
            print("[LLMClient] Request timed out")
            raise
        except Exception as e:
            print(f"[LLMClient] Unexpected error: {e}")
            raise

    async def close(self):
        """Close the underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# Module-level singleton
llm_client = LLMClient()
