"""
FAISS-based vector store for document chunk retrieval.
Uses IndexFlatIP (Inner Product) with pre-normalized vectors = cosine similarity.
Persists index + metadata to disk for reuse across restarts.
"""

import json
import numpy as np
import faiss
from pathlib import Path
from dataclasses import dataclass, asdict

from rag.embedder import embedder
from config import VECTOR_STORE_DIR, RETRIEVAL_TOP_K


@dataclass
class ChunkMetadata:
    """Metadata associated with each stored chunk."""
    content: str
    source: str
    chunk_index: int


class VectorStore:
    """FAISS-backed vector store with metadata persistence."""

    def __init__(self, store_dir: Path = VECTOR_STORE_DIR):
        self.store_dir = store_dir
        self.index_path = store_dir / "index.faiss"
        self.metadata_path = store_dir / "metadata.json"
        self.index: faiss.IndexFlatIP | None = None
        self.metadata: list[ChunkMetadata] = []
        self._loaded = False

    def _ensure_dir(self):
        """Create store directory if it doesn't exist."""
        self.store_dir.mkdir(parents=True, exist_ok=True)

    def _init_index(self, dimension: int):
        """Initialize a new empty FAISS index."""
        if dimension is None:
            # Fallback to embedder dimension if not provided
            dimension = embedder.dimension
            
        # IndexFlatIP = Inner Product (dot product)
        # With normalized vectors, IP == cosine similarity
        self.index = faiss.IndexFlatIP(dimension)
        self.metadata = []

    def add_documents(self, chunks: list[str], sources: list[str]):
        """
        Embed and add document chunks to the index.
        
        Args:
            chunks: List of text chunks to index.
            sources: List of source identifiers (one per chunk).
        """
        if not chunks:
            return

        print(f"[VectorStore] Embedding {len(chunks)} chunks...")
        embeddings = embedder.embed_documents(chunks)

        # Initialize index if needed
        if self.index is None:
            self._init_index(embeddings.shape[1])

        # Add to FAISS index
        self.index.add(embeddings)

        # Store metadata
        start_idx = len(self.metadata)
        for i, (chunk, source) in enumerate(zip(chunks, sources)):
            self.metadata.append(ChunkMetadata(
                content=chunk,
                source=source,
                chunk_index=start_idx + i
            ))

        print(f"[VectorStore] Index now contains {self.index.ntotal} vectors.")

    def search(self, query: str, top_k: int = RETRIEVAL_TOP_K) -> list[dict]:
        """
        Search the index for the most similar chunks to the query.
        
        Args:
            query: The user's question.
            top_k: Number of results to return.
            
        Returns:
            List of dicts with 'content', 'source', 'score' keys, sorted by relevance.
        """
        if self.index is None or self.index.ntotal == 0:
            return []

        # Embed the query
        query_vector = embedder.embed_query(query)
        query_vector = np.expand_dims(query_vector, axis=0)  # (1, dim)

        # FAISS search — sub-millisecond for <10K vectors
        scores, indices = self.index.search(query_vector, min(top_k, self.index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.metadata):
                continue
            meta = self.metadata[idx]
            results.append({
                "content": meta.content,
                "source": meta.source,
                "score": float(score)
            })

        return results

    def save(self):
        """Persist the FAISS index and metadata to disk."""
        if self.index is None:
            return

        self._ensure_dir()

        # Save FAISS index
        faiss.write_index(self.index, str(self.index_path))

        # Save metadata as JSON
        meta_dicts = [asdict(m) for m in self.metadata]
        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump(meta_dicts, f, ensure_ascii=False, indent=2)

        print(f"[VectorStore] Saved {self.index.ntotal} vectors to {self.store_dir}")

    def load(self) -> bool:
        """
        Load a previously persisted index from disk.
        Returns True if loaded successfully, False if no index found.
        """
        if self._loaded:
            return True

        if not self.index_path.exists() or not self.metadata_path.exists():
            print("[VectorStore] No persisted index found.")
            return False

        try:
            self.index = faiss.read_index(str(self.index_path))

            with open(self.metadata_path, "r", encoding="utf-8") as f:
                meta_dicts = json.load(f)
            self.metadata = [ChunkMetadata(**m) for m in meta_dicts]

            self._loaded = True
            print(f"[VectorStore] Loaded {self.index.ntotal} vectors from disk.")
            return True
        except Exception as e:
            print(f"[VectorStore] Failed to load index: {e}")
            return False

    @property
    def is_ready(self) -> bool:
        """Check if the vector store has data."""
        return self.index is not None and self.index.ntotal > 0


# Module-level singleton
vector_store = VectorStore()
