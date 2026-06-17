# AI Research Assistant — Unified Project

This repository contains both the frontend and backend parts of the AI Research Assistant project, structured for single-port Docker deployment (e.g. Hugging Face Spaces, Render, or self-hosted Docker).

## Repository Structure

- `AI_Research_Assistant-frontend/` — React SPA frontend (built with Vite + TypeScript)
- `AI_Research_Assistant-backend/` — FastAPI backend (handles text extraction, vector embeddings, Gemini Q&A, and reports)
- `Dockerfile` — Multi-stage build that compiles the React frontend and serves it directly through the FastAPI backend on port 7860.

---

## Local Development (Without Docker)

You can run both services independently on localhost:

### 1. Run the Backend
```bash
cd AI_Research_Assistant-backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Make sure to configure the `.env` file inside `AI_Research_Assistant-backend/` with your `GEMINI_API_KEY`.

### 2. Run the Frontend
```bash
cd AI_Research_Assistant-frontend
npm install
npm run dev
```

---

## Running with Docker Locally

To build and run the unified container locally:

1. Build the Docker image:
   ```bash
   docker build -t ai-research-assistant .
   ```

2. Run the container (pass your Gemini API key as an environment variable):
   ```bash
   docker run -p 7860:7860 -e GEMINI_API_KEY="your-gemini-api-key" ai-research-assistant
   ```

3. Open your browser and navigate to:
   * **App**: `http://localhost:7860/`
   * **API Docs**: `http://localhost:7860/docs`

---

## Deployment to Hugging Face Spaces

1. Create a new **Docker** Space on Hugging Face.
2. In the repository settings of the Space, add your `GEMINI_API_KEY` under the **Repository Secrets**.
3. Push the files in this repository (the `main` branch) to the Space's Git remote. Hugging Face will automatically trigger the Docker build using the root `Dockerfile` and run the app on port 7860.
