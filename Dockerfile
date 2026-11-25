FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PORT=5000

# Install system dependencies for OpenCV, Pillow, and DeepFace
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download DeepFace Facenet512 weights during Docker build (~95MB)
# This prevents network timeouts and cold-start delays when starting Gunicorn
RUN mkdir -p /root/.deepface/weights && \
    curl -L -o /root/.deepface/weights/facenet512_weights.h5 \
    https://github.com/serengil/deepface_models/releases/download/v1.0/facenet512_weights.h5

# Copy application source
COPY . .

# Expose default port
EXPOSE 5000

# Start Gunicorn server with dynamic $PORT injected by Railway
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --threads 4 --timeout 180 --chdir backend app:app"]
