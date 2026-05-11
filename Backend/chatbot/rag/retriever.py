"""
Retriever module — orchestrates query → embed → search → filter pipeline.
Returns only chunks that meet the relevance score threshold.
"""

from dataclasses import dataclass
from rag.vector_store import vector_store
from config import RETRIEVAL_SCORE_THRESHOLD, RETRIEVAL_TOP_K


@dataclass
class RetrievalResult:
    """A single retrieved chunk with its relevance score."""
    content: str
    source: str
    score: float


class Retriever:
    """Orchestrates the RAG retrieval pipeline."""

    def __init__(
        self,
        score_threshold: float = RETRIEVAL_SCORE_THRESHOLD,
        top_k: int = RETRIEVAL_TOP_K
    ):
        self.score_threshold = score_threshold
        self.top_k = top_k

    def retrieve(self, query: str) -> list[RetrievalResult]:
        """
        Retrieve relevant document chunks for a user query.

        Steps:
        1. Search FAISS index for top-K similar chunks
        2. Filter by score threshold (reject irrelevant results)
        3. Return sorted by relevance

        Args:
            query: The user's question or message.

        Returns:
            List of RetrievalResult objects, empty if nothing relevant found.
        """
        if not vector_store.is_ready:
            return []

        raw_results = vector_store.search(query, self.top_k)

        # Filter by score threshold to avoid feeding garbage to the LLM
        filtered = [
            RetrievalResult(
                content=r["content"],
                source=r["source"],
                score=r["score"]
            )
            for r in raw_results
            if r["score"] >= self.score_threshold
        ]

        return filtered

    def get_context_string(self, query: str) -> tuple[str, bool]:
        """
        Convenience method: retrieve and format chunks into a single context string.

        Returns:
            Tuple of (context_string, has_context).
            If no relevant chunks found, context_string is empty and has_context is False.
        """
        results = self.retrieve(query)

        if not results:
            return "", False

        context_parts = []
        for i, result in enumerate(results, 1):
            context_parts.append(
                f"[Source: {result.source} | Relevance: {result.score:.2f}]\n{result.content}"
            )

        context = "\n\n---\n\n".join(context_parts)
        return context, True


# Module-level singleton
retriever = Retriever()
