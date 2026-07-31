# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install CPU-only PyTorch first (saves ~1.5GB of GPU drivers for EasyOCR)
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --no-cache-dir

# Install remaining requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Pre-download OpenCV SFace ONNX models to avoid runtime timeouts on Render
RUN mkdir -p /app/models && \
    curl -L -o /app/models/face_detection_yunet_2023mar.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx && \
    curl -L -o /app/models/face_recognition_sface_2021dec.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx

# Pre-download EasyOCR models
RUN python -c "import easyocr; easyocr.Reader(['en'])"

# Expose default port
EXPOSE 8080

# Memory optimizations
ENV MALLOC_ARENA_MAX=2
ENV WEB_CONCURRENCY=1
ENV MAX_WORKERS=1

# Command to run the application (uses PORT env var dynamically)
CMD ["python", "main.py"]
