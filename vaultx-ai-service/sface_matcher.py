import os
import urllib.request
import cv2
import numpy as np
from fastapi import HTTPException

def download_file(url, filepath):
    if not os.path.exists(filepath):
        print(f"Downloading {filepath}...")
        urllib.request.urlretrieve(url, filepath)

def get_face_features(img_cv2):
    # Models are from OpenCV Zoo (Yunet for detection, SFace for recognition)
    yunet_url = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
    sface_url = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
    
    os.makedirs("models", exist_ok=True)
    yunet_path = "models/face_detection_yunet_2023mar.onnx"
    sface_path = "models/face_recognition_sface_2021dec.onnx"
    
    download_file(yunet_url, yunet_path)
    download_file(sface_url, sface_path)
    
    height, width, _ = img_cv2.shape
    detector = cv2.FaceDetectorYN.create(yunet_path, "", (width, height))
    recognizer = cv2.FaceRecognizerSF.create(sface_path, "")
    
    # Detect faces
    faces = detector.detect(img_cv2)
    if faces[1] is None:
        return None
    
    # Take the first detected face and align it
    face = faces[1][0]
    aligned_face = recognizer.alignCrop(img_cv2, face)
    
    # Extract 128D feature vector
    feature = recognizer.feature(aligned_face)
    return feature

def is_match(img1_cv2, img2_cv2, threshold=0.363):
    feat1 = get_face_features(img1_cv2)
    feat2 = get_face_features(img2_cv2)
    
    if feat1 is None or feat2 is None:
        raise HTTPException(status_code=400, detail="Face could not be detected in one or both images.")
        
    recognizer = cv2.FaceRecognizerSF.create("models/face_recognition_sface_2021dec.onnx", "")
    
    # Compute Cosine distance
    score = recognizer.match(feat1, feat2, cv2.FaceRecognizerSF_FR_COSINE)
    print(f"SFace Cosine Match Score: {score}")
    
    # Score >= 0.363 means it's the same person
    return score >= threshold, float(score)
