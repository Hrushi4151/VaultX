# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
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
