import os
import urllib.request
import cv2
import numpy as np
from fastapi import HTTPException

# Global models
_detector = None
_recognizer = None

def get_models(width, height):
    global _detector, _recognizer
    yunet_path = "/app/models/face_detection_yunet_2023mar.onnx"
    sface_path = "/app/models/face_recognition_sface_2021dec.onnx"
    
    # Fallback for local development
    if not os.path.exists(yunet_path) or not os.path.exists(sface_path):
        yunet_path = "models/face_detection_yunet_2023mar.onnx"
        sface_path = "models/face_recognition_sface_2021dec.onnx"
        if not os.path.exists(yunet_path):
            os.makedirs("models", exist_ok=True)
            urllib.request.urlretrieve("https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx", yunet_path)
        if not os.path.exists(sface_path):
            urllib.request.urlretrieve("https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx", sface_path)
            
    if _detector is None:
        _detector = cv2.FaceDetectorYN.create(yunet_path, "", (width, height))
    else:
        _detector.setInputSize((width, height))
        
    if _recognizer is None:
        _recognizer = cv2.FaceRecognizerSF.create(sface_path, "")
        
    return _detector, _recognizer

def get_face_features(img_cv2):
    # Resize image to save memory and avoid OOM (max dim 640)
    h, w = img_cv2.shape[:2]
    if max(w, h) > 640:
        scale = 640 / max(w, h)
        img_cv2 = cv2.resize(img_cv2, (int(w * scale), int(h * scale)))
    
    height, width, _ = img_cv2.shape
    detector, recognizer = get_models(width, height)
    
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
        raise ValueError("Face could not be detected in one or both images.")
        
    _, recognizer = get_models(320, 320) # Dimensions don't matter for recognizer match
    
    # Compute Cosine distance
    score = recognizer.match(feat1, feat2, cv2.FaceRecognizerSF_FR_COSINE)
    print(f"SFace Cosine Match Score: {score}")
    
    # Score >= 0.363 means it's the same person
    return score >= threshold, float(score)
