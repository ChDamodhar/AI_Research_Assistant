# AI Research Assistant — Backend

A **production-ready FastAPI backend** for analyzing research papers using AI.

## Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | JWT + bcrypt, register/login/profile |
| 📄 **PDF Upload** | Validate, store, create DB record |
| ⚙️ **Processing Pipeline** | Extract text, metadata, citations, chunk, embed, store |
| 📝 **Summarization** | Gemini-powered structured summaries |
| 💬 **RAG Q&A** | ChromaDB similarity search + Gemini answers |
| 📊 **Report Generation** | PDF + DOCX export via ReportLab & python-docx |
| 🎛️ **Dashboard** | User & admin aggregate statistics |

## Tech Stack

- **FastAPI** — async HTTP framework
- **SQLite + SQLAlchemy** — relational data
- **ChromaDB** — vector database for embeddings
- **BAAI/bge-small-en-v1.5** — sentence embeddings
- **PyMuPDF** — PDF text extraction
- **Gemini API** — LLM for summarization, QA, reports
- **LangChain** — text chunking
- **ReportLab + python-docx** — report export

## Quick Start

### 1. Setup

```powershell
# Run the setup script (creates venv + installs deps)
.\setup_venv.ps1
```

Or manually:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Configure

Edit `.env` and set your **Gemini API key**:
```env
GEMINI_API_KEY=your-key-here
```

Get a free key at: https://aistudio.google.com/app/apikey

### 3. Run

```powershell
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Open Swagger UI: http://localhost:8000/docs

## API Overview

### Authentication
```
POST /api/auth/register     — Create account
POST /api/auth/login        — Get JWT token
GET  /api/auth/profile      — View profile
PUT  /api/auth/profile      — Update profile
PUT  /api/auth/change-password
```

### Papers
```
POST /api/papers/upload            — Upload PDF (triggers pipeline)
GET  /api/papers                   — List papers (paginated, search, sort)
GET  /api/papers/{id}              — Paper details
GET  /api/papers/{id}/citations    — Extracted citations
GET  /api/papers/{id}/summary      — AI summary (generates if missing)
POST /api/papers/{id}/report       — Generate PDF/DOCX report
```

### Q&A
```
POST /api/chat                     — Ask a question (RAG)
GET  /api/chat/{paper_id}/history  — Chat history
```

### Reports & Dashboard
```
GET  /api/reports                  — List all reports
GET  /api/reports/{id}/download    — Download report file
GET  /api/dashboard                — User statistics
```

### Admin
```
GET  /api/admin/stats              — Platform stats (admin only)
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app + lifespan
│   ├── config.py            # Centralized settings
│   ├── api/
│   │   ├── auth.py          # Auth routes
│   │   ├── papers.py        # Paper routes
│   │   ├── chat.py          # Chat/RAG routes
│   │   ├── reports.py       # Reports + dashboard
│   │   └── admin.py         # Admin routes
│   ├── services/
│   │   ├── auth_service.py        # JWT + bcrypt
│   │   ├── paper_service.py       # Paper CRUD + pipeline
│   │   ├── pdf_service.py         # PyMuPDF extraction
│   │   ├── citation_service.py    # Reference parsing
│   │   ├── chunking_service.py    # LangChain splitter
│   │   ├── embedding_service.py   # BGE embeddings
│   │   ├── summary_service.py     # Gemini summaries
│   │   ├── rag_service.py         # RAG pipeline
│   │   ├── report_service.py      # Report generation
│   │   └── dashboard_service.py   # Stats queries
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic schemas
│   ├── prompts/             # LLM prompt templates
│   ├── db/
│   │   ├── sqlite.py        # Async SQLAlchemy engine
│   │   └── chromadb.py      # ChromaDB client
│   └── utils/
│       ├── dependencies.py  # FastAPI DI (auth, db)
│       ├── exceptions.py    # Custom exceptions + handlers
│       ├── helpers.py       # File validation, paths
│       └── logger.py        # Structured logging
├── uploads/                 # Uploaded PDFs
├── reports/                 # Generated reports
├── chroma_db/               # ChromaDB persistent store
├── logs/                    # Application logs
├── requirements.txt
├── .env
└── setup_venv.ps1
```

## Processing Pipeline

```
PDF Upload
    ↓
Validate File
    ↓
Store in uploads/
    ↓
Create DB Record (status=pending)
    ↓  [background task]
PyMuPDF Text Extraction
    ↓
Metadata Extraction (title, authors, abstract)
    ↓
Citation Extraction (regex-based reference parsing)
    ↓
LangChain Chunking (chunk_size=1000, overlap=200)
    ↓
BGE Embedding Generation (batch)
    ↓
ChromaDB Upsert (with metadata)
    ↓
status=ready
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | **Required.** Your Gemini API key |
| `SECRET_KEY` | dev key | JWT signing secret |
| `DATABASE_URL` | SQLite | Database connection string |
| `EMBEDDING_MODEL` | BAAI/bge-small-en-v1.5 | Sentence transformer model |
| `CHUNK_SIZE` | 1000 | Text chunk size |
| `CHUNK_OVERLAP` | 200 | Chunk overlap |
| `RAG_TOP_K` | 5 | Chunks retrieved per query |
| `MAX_FILE_SIZE_MB` | 50 | Max PDF upload size |
