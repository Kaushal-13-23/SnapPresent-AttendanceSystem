FROM python:3.11-slim

# Prevent interactive prompts during apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies for OpenCV, Pillow, and DeepFace
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create Hugging Face standard non-root user (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR $HOME/app

# Install Python requirements
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download DeepFace Facenet512 model weights during image build
# This eliminates cold-start download delays (~95MB) on space startup
RUN mkdir -p $HOME/.deepface/weights && \
    curl -L -o $HOME/.deepface/weights/facenet512_weights.h5 \
    https://github.com/serengil/deepface_models/releases/download/v1.0/facenet512_weights.h5

# Copy all application files
COPY --chown=user:user . .

# Expose port (default 5000 or Railway/HF dynamic $PORT)
EXPOSE 5000

# Run Gunicorn server with dynamic $PORT support
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --threads 4 --timeout 180 app:app"]
