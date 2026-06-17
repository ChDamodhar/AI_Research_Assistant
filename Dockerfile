# ── Stage 1: Build Frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies and install
COPY AI_Research_Assistant-frontend/package*.json ./
RUN npm install

# Copy source and build
COPY AI_Research_Assistant-frontend/ ./
RUN npm run build

# ── Stage 2: Serve Backend & Frontend ──────────────────────────────────────────
FROM python:3.11-slim AS runner
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY AI_Research_Assistant-backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY AI_Research_Assistant-backend/ ./

# Copy built frontend assets to the directory expected by the backend static router
COPY --from=frontend-builder /app/frontend/dist /app/AI_Research_Assistant-frontend/dist

# Expose port (default for Hugging Face Spaces or custom Docker runner)
EXPOSE 7860

# Run FastAPI application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
