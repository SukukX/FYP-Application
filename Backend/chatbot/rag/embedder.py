"""
Embedding module using sentence-transformers/all-MiniLM-L6-v2.
Singleton pattern — model loads once at startup, subsequent calls are ~5ms.
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL_NAME


class Embedder:
    """Singleton wrapper around SentenceTransformer for embedding text."""

    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _ensure_loaded(self):
        """Lazy-load the model on first use."""
        if self._model is None:
            print(f"[Embedder] Loading model: {EMBEDDING_MODEL_NAME}")
            self._model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            print(f"[Embedder] Model loaded. Dimension: {self._model.get_sentence_embedding_dimension()}")

    @property
    def dimension(self) -> int:
        """Return the embedding dimension."""
        self._ensure_loaded()
        return self._model.get_sentence_embedding_dimension()

    def embed_query(self, text: str) -> np.ndarray:
        """
        Embed a single query string.
        Returns a normalized vector (for cosine similarity via dot product).
        """
        self._ensure_loaded()
        embedding = self._model.encode(
            text,
            normalize_embeddings=True,  # Pre-normalize for cosine sim
            show_progress_bar=False
        )
        return np.array(embedding, dtype=np.float32)

    def embed_documents(self, texts: list[str]) -> np.ndarray:
        """
        Embed a batch of document chunks.
        Returns normalized vectors (N x dimension).
        """
        self._ensure_loaded()
        embeddings = self._model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=True,
            batch_size=64
        )
        return np.array(embeddings, dtype=np.float32)


# Module-level singleton instance
embedder = Embedder()
