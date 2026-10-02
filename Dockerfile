# Stage 1: build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Stage 2: runtime
FROM python:3.11-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  STREAMLENS_DEMO_MODE=1 \
  STREAMLENS_DATA_DIR=/app/backend/data

RUN apt-get update && apt-get install -y --no-install-recommends \
  libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend_dist/

# Hugging Face Spaces runs containers as a non-root user (UID 1000).
RUN useradd -m -u 1000 user && mkdir -p /app/backend/data && chown -R user /app
USER user

WORKDIR /app/backend
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
