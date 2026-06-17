"""
Prompts — Research Report Generation Prompt Template
"""

REPORT_SYSTEM_PROMPT = """You are an expert academic report writer specializing in research paper analysis.
Generate comprehensive, professional research analysis reports based on the provided information."""

REPORT_USER_PROMPT = """Generate a comprehensive research analysis report based on the following information about a research paper.

=== PAPER METADATA ===
Title: {title}
Authors: {authors}
Abstract: {abstract}

=== PAPER SUMMARY ===
{summary}

=== CITATIONS ({citation_count} total) ===
{citations}

=== QUESTION & ANSWER INSIGHTS ===
{qa_insights}

---

Generate a formal, structured research report with the following sections. Use professional academic language.

# Research Analysis Report: {title}

## 1. Executive Summary
[A 2-3 paragraph high-level overview of the paper, its significance, and key contributions]

## 2. Research Objective
[Detailed explanation of the research goals, problem statement, and motivation]

## 3. Methodology
[In-depth analysis of the research approach, techniques, datasets, and experimental setup]

## 4. Key Findings
[Detailed analysis of the results, discoveries, and contributions with their implications]

## 5. Citation Analysis
[Analysis of the {citation_count} references cited. Identify key foundational works, recency of citations, and research lineage]

## 6. Future Scope
[Based on the findings, what are potential directions for future research? What gaps remain?]

## 7. Conclusion
[Overall assessment of the paper's contribution to the field and its practical implications]"""
