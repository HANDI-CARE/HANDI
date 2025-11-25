# ===== Builder stage =====
FROM python:3.11-slim AS builder

# Faster, reproducible installs
ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System deps for building wheels
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       gcc \
       g++ \
       pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifest first for better layer cache
COPY requirements.txt ./

# Create lightweight venv for dependencies
RUN python -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt


# ===== Runtime stage =====
FROM python:3.11-slim AS runtime

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TOKENIZERS_PARALLELISM=false \
    TRANSFORMERS_VERBOSITY=error \
    HF_HOME=/tmp/hf_cache \
    TORCH_HOME=/tmp/torch_cache

# Minimal runtime shared libs (numpy/onnx/tokenizers)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libgomp1 \
       libglib2.0-0 \
       libsm6 \
       libxext6 \
       libxrender1 \
       libgl1 \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Bring in prebuilt virtualenv
COPY --from=builder /opt/venv /opt/venv

WORKDIR /app

# Copy app sources
COPY app/ app/
COPY main.py ./

# Default port for FastAPI
ENV PORT=5501
EXPOSE 5501

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5501"]


