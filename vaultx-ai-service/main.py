import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import easyocr
import numpy as np
import cv2
import fitz  # PyMuPDF
import base64
from pydantic import BaseModel
# from deepface import DeepFace (lazy loaded now)

class FaceMatchRequest(BaseModel):
    registeredImage: str
    candidateImage: str

app = FastAPI(title="VaultX AI Service")

reader = None # Lazy load EasyOCR

@app.get("/api/v1/health")
async def health_check():
    return {"status": "UP", "service": "VaultX AI Service"}

@app.post("/api/v1/ai/ocr")
async def extract_text(file: UploadFile = File(...)):
    """
    Accepts an image file and returns extracted text using EasyOCR.
    """
    # Relaxed content-type check because RestTemplate might send application/octet-stream
    # We will rely on cv2.imdecode to validate if it's a valid image.

    try:
        # Read file bytes
        contents = await file.read()
        extracted_text = ""
        
        global reader
        if reader is None:
            print("Lazy loading EasyOCR Model...")
            reader = easyocr.Reader(['en'])
            print("EasyOCR Model loaded.")
        
        # Check if PDF
        is_pdf = file.filename.lower().endswith('.pdf') or file.content_type == 'application/pdf'
        
        if is_pdf:
            print(f"Processing PDF document: {file.filename}")
            doc = fitz.open(stream=contents, filetype="pdf")
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap(dpi=150)
                img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                
                if pix.n == 3:
                    img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                elif pix.n == 4:
                    img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
                    
                results = reader.readtext(img_array, detail=0, paragraph=True)
                if len(doc) > 1:
                    extracted_text += f"\n--- Page {page_num + 1} ---\n"
                extracted_text += "\n\n".join(results) + "\n"
            doc.close()
        else:
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                raise HTTPException(status_code=400, detail="Could not decode image or PDF.")

            results = reader.readtext(img, detail=0, paragraph=True)
            extracted_text = "\n\n".join(results)
        
        print(f"--- OCR EXTRACTION SUCCESS ---")
        print(f"File: {file.filename}")
        print(f"Extracted Text:\n{extracted_text}")
        print(f"------------------------------")
        
        return JSONResponse(content={
            "success": True,
            "text": extracted_text,
            "engine": "EasyOCR"
        })

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error during OCR extraction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/ai/face-match")
async def match_faces(request: FaceMatchRequest):
    """
    Accepts two base64 encoded images and verifies if they belong to the same person.
    """
    try:
        # Decode base64 to numpy arrays
        reg_bytes = base64.b64decode(request.registeredImage)
        cand_bytes = base64.b64decode(request.candidateImage)
        
        reg_arr = np.frombuffer(reg_bytes, np.uint8)
        cand_arr = np.frombuffer(cand_bytes, np.uint8)
        
        reg_img = cv2.imdecode(reg_arr, cv2.IMREAD_COLOR)
        cand_img = cv2.imdecode(cand_arr, cv2.IMREAD_COLOR)
        
        if reg_img is None or cand_img is None:
            raise HTTPException(status_code=400, detail="Invalid image data provided.")

        print("Lazy loading DeepFace Model...")
        from deepface import DeepFace
        # Enforce detection ensures that if no face is found, it throws an exception (which we catch)
        result = DeepFace.verify(
            img1_path=reg_img, 
            img2_path=cand_img,
            enforce_detection=True,
            detector_backend='opencv', # opencv is much lighter for 512MB RAM
            model_name='Facenet',      # Facenet is much lighter than VGG-Face
            anti_spoofing=False         # Disabled to save memory on Render Free Tier
        )
        
        is_match = bool(result.get("verified", False))
        distance = float(result.get("distance", 1.0))
        
        # Strict Liveness Detection Check
        # DeepFace sets 'is_real' in facial_areas for img1/img2 or in the root result
        is_real = True
        facial_areas = result.get("facial_areas", {})
        
        if "img2" in facial_areas and isinstance(facial_areas["img2"], dict):
            if "is_real" in facial_areas["img2"]:
                is_real = bool(facial_areas["img2"]["is_real"])
        elif "is_real" in result:
            is_real = bool(result["is_real"])
            
        if is_match and not is_real:
            print("🚨 SPOOF DETECTED! Face matched but liveness check failed.")
            is_match = False
            
        print(f"--- FACE VERIFICATION SUCCESS ---")
        print(f"Match: {is_match}, Distance: {distance}, Real: {is_real}")
        print(f"---------------------------------")
        
        return JSONResponse(content={
            "success": True,
            "match": is_match,
            "confidence": 1.0 - distance, # rough confidence metric based on distance
            "reason": "Verified successfully" if is_match else "Face Biometric Mismatch or Liveness Failed"
        })
        
    except ValueError as ve:
        # DeepFace raises ValueError if face could not be detected OR if Spoofing is detected
        print(f"Face Detection/Spoofing Error: {str(ve)}")
        return JSONResponse(content={
            "success": False,
            "match": False,
            "confidence": 0.0,
            "reason": "Authentication Failed: No valid face found OR Liveness check failed (Spoof detected)."
        })
    except Exception as e:
        print(f"Error during face verification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
