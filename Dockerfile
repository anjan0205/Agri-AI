# --- Stage 1: Build the React Frontend ---
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy configuration and source files
COPY vite.config.js postcss.config.js tailwind.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Build the frontend
RUN npm run build

# --- Stage 2: Final Runtime ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (libgomp1 for XGBoost/LightGBM)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source and ML models
COPY backend/ ./backend/
COPY models/ ./models/
COPY crop_advisory_system.py crop_suitability_system.py ./

# Copy the built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Railway uses the $PORT environment variable
EXPOSE 8080

# Start gunicorn
CMD gunicorn --bind 0.0.0.0:$PORT backend.api:app
