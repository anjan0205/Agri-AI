# Stage 1: Build the React Application
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build the Python Flask API Server
FROM python:3.10-slim
WORKDIR /app

# Install project dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend logic
COPY . .

# Import compiled static UI from the build stage
COPY --from=build /app/dist ./dist

# Run Gunicorn seamlessly bound to the environment variable assigned by Railway
CMD gunicorn api:app --bind 0.0.0.0:$PORT
