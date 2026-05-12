"""
Document ingestion module.
Reads knowledge documents, splits into chunks, and indexes them into the vector store.
Only runs when explicitly triggered — not on every request.
"""

import re
from pathlib import Path
from rag.vector_store import vector_store
from config import KNOWLEDGE_DIR, CHUNK_SIZE, CHUNK_OVERLAP


def _recursive_split(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """
    Split text into overlapping chunks using a recursive character splitter.
    Tries to split on paragraph boundaries first, then sentences, then words.
    
    Args:
        text: The full document text.
        chunk_size: Maximum characters per chunk.
        chunk_overlap: Number of overlapping characters between chunks.
        
    Returns:
        List of text chunks.
    """
    # Separators in order of preference
    separators = ["\n\n", "\n", ". ", " "]

    chunks = []
    _split_recursive(text, separators, chunk_size, chunk_overlap, chunks)
    return chunks


def _split_recursive(
    text: str,
    separators: list[str],
    chunk_size: int,
    chunk_overlap: int,
    result: list[str]
):
    """Recursively split text trying separators from most to least granular."""
    if len(text) <= chunk_size:
        stripped = text.strip()
        if stripped:
            result.append(stripped)
        return

    # Find the best separator for this text
    separator = separators[0] if separators else " "
    remaining_separators = separators[1:] if len(separators) > 1 else separators

    parts = text.split(separator)

    current_chunk = ""
    for part in parts:
        candidate = (current_chunk + separator + part).strip() if current_chunk else part.strip()

        if len(candidate) <= chunk_size:
            current_chunk = candidate
        else:
            # Save the current chunk
            if current_chunk.strip():
                result.append(current_chunk.strip())

            # If this single part is too long, recurse with finer separators
            if len(part) > chunk_size:
                _split_recursive(part, remaining_separators, chunk_size, chunk_overlap, result)
                current_chunk = ""
            else:
                # Start new chunk with overlap from previous
                if current_chunk and chunk_overlap > 0:
                    overlap_text = current_chunk[-chunk_overlap:]
                    current_chunk = overlap_text + separator + part
                else:
                    current_chunk = part

    # Don't forget the last chunk
    if current_chunk.strip():
        result.append(current_chunk.strip())


def _extract_section_source(chunk: str, filename: str) -> str:
    """
    Try to extract a section heading from the chunk for better source attribution.
    Falls back to the filename.
    """
    # Look for markdown headings in the chunk
    heading_match = re.search(r'^#{1,3}\s+(.+)$', chunk, re.MULTILINE)
    if heading_match:
        return f"{filename} > {heading_match.group(1).strip()}"
    return filename


def ingest_knowledge_base() -> dict:
    """
    Read all .md files from the knowledge directory, chunk them,
    and index them into the vector store.
    
    Returns:
        Dict with ingestion statistics.
    """
    knowledge_files = list(KNOWLEDGE_DIR.glob("*.md"))

    if not knowledge_files:
        return {"status": "error", "message": f"No .md files found in {KNOWLEDGE_DIR}"}

    all_chunks = []
    all_sources = []
    total_chars = 0

    for filepath in knowledge_files:
        print(f"[Ingestion] Processing: {filepath.name}")
        text = filepath.read_text(encoding="utf-8")
        total_chars += len(text)

        chunks = _recursive_split(text, CHUNK_SIZE, CHUNK_OVERLAP)

        for chunk in chunks:
            source = _extract_section_source(chunk, filepath.name)
            all_chunks.append(chunk)
            all_sources.append(source)

    print(f"[Ingestion] Total: {len(all_chunks)} chunks from {len(knowledge_files)} file(s)")

    # Clear existing index and rebuild
    from rag.embedder import embedder
    vector_store._init_index(embedder.dimension)

    # Add to vector store
    vector_store.add_documents(all_chunks, all_sources)

    # Persist to disk
    vector_store.save()

    return {
        "status": "success",
        "files_processed": len(knowledge_files),
        "total_chunks": len(all_chunks),
        "total_characters": total_chars,
        "filenames": [f.name for f in knowledge_files]
    }

if __name__ == "__main__":
    print("🚀 Starting knowledge base ingestion...")
    result = ingest_knowledge_base()
    if result["status"] == "success":
        print(f"✅ Ingestion complete. Processed {result['files_processed']} files, {result['total_chunks']} chunks.")
    else:
        print(f"❌ Ingestion failed: {result.get('message')}")

