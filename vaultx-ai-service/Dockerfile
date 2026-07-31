# ===========================
# Base Image
# ===========================
FROM python:3.10-slim

# Working directory
WORKDIR /app

# ===========================
# System Dependencies
# ===========================
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ===========================
# Copy Requirements
# ===========================
COPY requirements.txt .

# Upgrade pip
RUN pip install --upgrade pip

# Install CPU-only PyTorch first (saves ~1.5GB of GPU drivers for EasyOCR)
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --no-cache-dir

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# ===========================
# Copy Project
# ===========================
COPY . .

# ===========================
# Download OpenCV Models
# ===========================
RUN mkdir -p /app/models && \
    curl -L -o /app/models/face_detection_yunet_2023mar.onnx \
    https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx && \
    curl -L -o /app/models/face_recognition_sface_2021dec.onnx \
    https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx

# ===========================
# Download EasyOCR Models During Build
# ===========================
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"

# ===========================
# Environment
# ===========================
ENV PYTHONUNBUFFERED=1
ENV MALLOC_ARENA_MAX=2
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1

# ===========================
# Railway Port
# ===========================
EXPOSE 8080

# ===========================
# Start FastAPI (Dynamic Port)
# ===========================
CMD ["python", "main.py"]