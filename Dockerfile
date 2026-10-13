# ===================================================
# Multi-Stage Production Dockerfile for StayWise
# Builds React Frontend + Runs Flask Backend Together
# ===================================================

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend with WSGI Gunicorn
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy Backend Source Code
COPY backend/ ./backend/

# Copy Compiled React Dist from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Environment configuration
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production
ENV FRONTEND_DIST=/app/frontend/dist
ENV PORT=10000

EXPOSE 10000

# Run Gunicorn binding dynamically to Render's $PORT
CMD ["sh", "-c", "gunicorn --chdir backend app:app --bind 0.0.0.0:${PORT:-10000} --workers 2 --threads 4 --timeout 120"]
