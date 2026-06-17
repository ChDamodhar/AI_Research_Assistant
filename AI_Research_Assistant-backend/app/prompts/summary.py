"""
Prompts — Summary Generation Prompt Template
"""

SUMMARY_SYSTEM_PROMPT = """You are an expert research analyst specializing in academic papers.
Your task is to analyze research papers and generate structured, concise summaries."""

SUMMARY_USER_PROMPT = """Analyze the following research paper text and provide a structured summary.

Research Paper Text:
{paper_text}

Provide a structured summary with the following four sections. Use clear academic language and be concise.

Format your response EXACTLY as follows:

## Objective
[What is the main goal, problem statement, or research question of this paper?]

## Methodology
[What methods, techniques, datasets, or approaches were used?]

## Findings
[What are the key results, discoveries, or contributions?]

## Conclusion
[What conclusions were drawn? What is the significance and potential impact?]"""
