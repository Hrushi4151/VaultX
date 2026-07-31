# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install CPU-only PyTorch first (saves ~1.5GB of GPU drivers)
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --no-cache-dir

# Install CPU-only TensorFlow first (saves ~1GB of GPU drivers)
RUN pip install tensorflow-cpu==2.16.1 --no-cache-dir

# Install the rest of the requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Pre-download AI Models to avoid runtime timeouts
RUN python -c "import easyocr; easyocr.Reader(['en'])"
RUN python -c "from deepface import DeepFace; DeepFace.build_model('VGG-Face')"

# Expose port
EXPOSE 8080

# Command to run the application
CMD ["python", "main.py"]
