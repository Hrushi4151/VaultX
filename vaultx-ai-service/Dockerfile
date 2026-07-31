# ============================================
# Base Image
# ============================================
FROM python:3.10-slim

# Working directory
WORKDIR /app

# ============================================
# Install system packages
# ============================================
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# Copy requirements
# ============================================
COPY requirements.txt .

# Upgrade pip
RUN pip install --upgrade pip

# Install CPU-only PyTorch
RUN pip install --no-cache-dir \
    torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# ============================================
# Copy project
# ============================================
COPY . .

# ============================================
# Download OpenCV Models
# ============================================
RUN mkdir -p /app/models && \
    curl -L -o /app/models/face_detection_yunet_2023mar.onnx \
    https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx && \
    curl -L -o /app/models/face_recognition_sface_2021dec.onnx \
    https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx

# ============================================
# Pre-download EasyOCR Models
# ============================================
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"

# ============================================
# Environment Variables
# ============================================
ENV PYTHONUNBUFFERED=1
ENV MALLOC_ARENA_MAX=2
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1

# Railway provides PORT automatically
ENV PORT=8080

EXPOSE 8080

# ============================================
# Start FastAPI
# ============================================
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]