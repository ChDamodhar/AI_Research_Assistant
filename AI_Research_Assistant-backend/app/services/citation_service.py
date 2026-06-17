"""
Services — Citation Extraction Service
Parses the References section to extract structured citation data.
Uses regex-based extraction with optional Gemini-assisted fallback.
"""

import logging
import re
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger("app")


@dataclass
class ParsedCitation:
    """Represents a single parsed citation."""
    author: Optional[str] = None
    year: Optional[str] = None
    title: Optional[str] = None
    raw_text: Optional[str] = None


# ── Regex Patterns ────────────────────────────────────────────────────────────

# Match numbered references like: [1] Author, A. (2020). Title of paper.
NUMBERED_REF_PATTERN = re.compile(
    r"^\s*\[?\d+\]?\s*(.+)$", re.MULTILINE
)

# Match author(s) and year: Author, A., & Author, B. (2020).
AUTHOR_YEAR_PATTERN = re.compile(
    r"^([A-Z][a-zA-Z\s,&\.]+?)\s*[\(\[](\d{4})[\)\]]",
    re.MULTILINE,
)

# Year extraction
YEAR_PATTERN = re.compile(r"[\(\[](\d{4})[\)\]]\.*")

# Title extraction (text after year, before journal/venue)
TITLE_AFTER_YEAR_PATTERN = re.compile(
    r"[\(\[]\d{4}[\)\]]\.*\s*(.+?)(?:\.\s+[A-Z]|\.$|,\s+[A-Z]|$)",
    re.DOTALL,
)


def _split_references_section(references_text: str) -> list[str]:
    """
    Split the references section into individual reference strings.
    Handles both numbered ([1], 1.) and author-year (APA) styles.
    """
    if not references_text.strip():
        return []

    # Try numbered reference splitting
    numbered_refs = re.split(r"\n\s*\[?\d+\]?\s+", references_text)
    if len(numbered_refs) > 1:
        return [r.strip() for r in numbered_refs if r.strip()]

    # Try splitting by double newlines (common in APA style)
    double_newline_refs = re.split(r"\n\s*\n", references_text)
    if len(double_newline_refs) > 1:
        return [r.strip().replace("\n", " ") for r in double_newline_refs if r.strip()]

    # Fallback: split by lines starting with capital letter after a period
    lines = references_text.split("\n")
    current: list[str] = []
    refs: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current:
                refs.append(" ".join(current))
                current = []
        else:
            current.append(stripped)
    if current:
        refs.append(" ".join(current))

    return [r for r in refs if len(r) > 20]  # filter out noise


def _parse_single_reference(raw_ref: str) -> ParsedCitation:
    """
    Parse a single reference string into structured fields.
    """
    citation = ParsedCitation(raw_text=raw_ref[:500])

    # Extract year
    year_match = YEAR_PATTERN.search(raw_ref)
    if year_match:
        citation.year = year_match.group(1)

    # Extract author: text before the year or first period
    if year_match:
        author_part = raw_ref[:year_match.start()].strip().rstrip(",").strip()
    else:
        # Take everything before first period as author
        parts = raw_ref.split(".")
        author_part = parts[0].strip() if parts else ""

    # Clean numbered prefix from author
    author_part = re.sub(r"^\[?\d+\]?\s*", "", author_part).strip()
    citation.author = author_part[:200] if author_part else None

    # Extract title: text after year until the next period + capital (journal start)
    if year_match:
        after_year = raw_ref[year_match.end():].strip().lstrip(".").strip()
        # Title typically ends at the next period followed by a journal/conference name
        title_match = re.match(r"^(.+?)\.(?=\s+[A-Z]|\s*$)", after_year, re.DOTALL)
        if title_match:
            citation.title = title_match.group(1).strip()[:300]
        else:
            citation.title = after_year[:300] if after_year else None
    else:
        # Try extracting title as second sentence
        sentences = raw_ref.split(". ")
        if len(sentences) > 1:
            citation.title = sentences[1].strip()[:300]

    return citation


def extract_citations(references_text: str) -> list[ParsedCitation]:
    """
    Extract structured citations from the references section text.

    Args:
        references_text: Raw text of the references/bibliography section.

    Returns:
        List of ParsedCitation objects.
    """
    if not references_text or not references_text.strip():
        logger.warning("No references text provided for citation extraction.")
        return []

    raw_refs = _split_references_section(references_text)
    logger.info(f"Found {len(raw_refs)} raw reference entries.")

    citations: list[ParsedCitation] = []
    for raw_ref in raw_refs:
        if len(raw_ref) < 10:
            continue
        try:
            citation = _parse_single_reference(raw_ref)
            citations.append(citation)
        except Exception as e:
            logger.warning(f"Failed to parse citation: {e} | raw='{raw_ref[:100]}'")

    logger.info(f"Successfully parsed {len(citations)} citations.")
    return citations
