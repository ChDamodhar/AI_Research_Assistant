"""
Services — PDF Processing Service
Uses PyMuPDF (fitz) to extract:
- Full text
- Title, Authors, Abstract (metadata)
- Section text (Introduction, Methodology, Results, Conclusion, References)
"""

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger("app")


@dataclass
class PaperSections:
    """Extracted sections from a research paper PDF."""
    full_text: str = ""
    title: str = ""
    authors: str = ""
    abstract: str = ""
    introduction: str = ""
    methodology: str = ""
    results: str = ""
    conclusion: str = ""
    references: str = ""
    other_sections: dict[str, str] = field(default_factory=dict)

    def to_sections_dict(self) -> dict[str, str]:
        """Return all non-empty sections as a dict (for chunking)."""
        sections = {
            "abstract": self.abstract,
            "introduction": self.introduction,
            "methodology": self.methodology,
            "results": self.results,
            "conclusion": self.conclusion,
        }
        # Add other sections
        sections.update(self.other_sections)
        # If major sections are empty, fallback to full text
        if not any(sections.values()):
            sections["full_text"] = self.full_text
        return {k: v for k, v in sections.items() if v.strip()}


# ── Section detection keywords ────────────────────────────────────────────────

SECTION_PATTERNS = {
    "abstract": r"^(abstract)\s*$",
    "introduction": r"^(\d+\.?\s*)?(introduction|overview|background)\s*$",
    "methodology": r"^(\d+\.?\s*)?(methodology|methods?|approach|proposed method|framework|system design)\s*$",
    "results": r"^(\d+\.?\s*)?(results?|experiments?|evaluation|performance|discussion)\s*$",
    "conclusion": r"^(\d+\.?\s*)?(conclusion|concluding remarks|summary|future work)\s*$",
    "references": r"^(references?|bibliography|works cited)\s*$",
}


def _detect_section(line: str) -> Optional[str]:
    """Return section name if the line matches a section heading pattern."""
    clean = line.strip().lower()
    for section, pattern in SECTION_PATTERNS.items():
        if re.match(pattern, clean, re.IGNORECASE):
            return section
    return None


def _extract_metadata_from_first_page(first_page_text: str) -> tuple[str, str, str]:
    """
    Heuristically extract title, authors, and abstract from first page text.

    Returns:
        (title, authors, abstract)
    """
    lines = [l.strip() for l in first_page_text.split("\n") if l.strip()]

    title = ""
    authors = ""
    abstract = ""

    # Title is typically the first non-empty line (or longest line in first 5)
    if lines:
        # Try to find the most prominent line (often longest in first few lines)
        title_candidates = lines[:5]
        title = max(title_candidates, key=len) if title_candidates else lines[0]

    # Authors: look for lines with common patterns (commas, "and", email-like, affiliations)
    author_lines = []
    for i, line in enumerate(lines[1:10], start=1):
        # Skip the title line
        if line == title:
            continue
        # Authors often contain commas or "and"
        if re.search(r",|\band\b|@", line, re.IGNORECASE) and len(line) < 300:
            author_lines.append(line)
            if len(author_lines) >= 3:
                break
    authors = " | ".join(author_lines) if author_lines else ""

    # Abstract: find the text after "Abstract" keyword
    text_lower = first_page_text.lower()
    abstract_start = text_lower.find("abstract")
    if abstract_start != -1:
        abstract_text = first_page_text[abstract_start + 8:].strip()
        # Take up to 2000 characters or until next section
        abstract = abstract_text[:2000].strip()

    return title, authors, abstract


def extract_pdf(file_path: str | Path) -> PaperSections:
    """
    Extract all text and sections from a PDF file using PyMuPDF.

    Args:
        file_path: Path to the PDF file.

    Returns:
        PaperSections object with all extracted content.
    """
    import fitz  # PyMuPDF

    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")

    logger.info(f"Extracting PDF: {file_path.name}")

    result = PaperSections()

    try:
        doc = fitz.open(str(file_path))
        all_text_parts = []
        current_section = "general"
        section_texts: dict[str, list[str]] = {s: [] for s in SECTION_PATTERNS}
        section_texts["general"] = []

        for page_num, page in enumerate(doc):
            page_text = page.get_text("text")  # type: ignore[attr-defined]
            all_text_parts.append(page_text)

            # First page: extract metadata
            if page_num == 0:
                title, authors, abstract = _extract_metadata_from_first_page(page_text)
                result.title = title
                result.authors = authors
                result.abstract = abstract

            # Section detection
            for line in page_text.split("\n"):
                detected = _detect_section(line)
                if detected:
                    current_section = detected
                else:
                    section_texts.get(current_section, section_texts["general"]).append(line)

        page_count = len(doc)
        doc.close()

        result.full_text = "\n".join(all_text_parts)
        result.introduction = "\n".join(section_texts.get("introduction", []))
        result.methodology = "\n".join(section_texts.get("methodology", []))
        result.results = "\n".join(section_texts.get("results", []))
        result.conclusion = "\n".join(section_texts.get("conclusion", []))
        result.references = "\n".join(section_texts.get("references", []))

        # If abstract wasn't in first page, try from section detection
        if not result.abstract and section_texts.get("abstract"):
            result.abstract = "\n".join(section_texts["abstract"])

        logger.info(
            f"PDF extraction complete: {page_count} pages, "
            f"title='{result.title[:60]}...', "
            f"full_text={len(result.full_text)} chars"
        )

    except Exception as e:
        logger.error(f"PDF extraction failed for {file_path.name}: {e}")
        raise

    return result
