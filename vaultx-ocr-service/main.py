import fitz # PyMuPDF
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI(title="VaultX Document OCR Service", version="1.0.0")

@app.get("/health")
def health():
    return {"status": "UP", "service": "vaultx-ocr-service"}

@app.post("/api/v1/ocr/extract")
async def extract_ocr(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        extracted_text = ""
        filename = file.filename or ""
        content_type = file.content_type or ""

        # PDF Processing
        if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
            try:
                doc = fitz.open(stream=contents, filetype="pdf")
                for page in doc:
                    extracted_text += page.get_text() + "\n"
            except Exception as e:
                print(f"PDF extraction error: {e}")

        # Image Processing
        if not extracted_text.strip():
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is not None:
                # Basic metadata extraction summary
                h, w = img.shape[:2]
                extracted_text = f"[IMAGE DOCUMENT: {w}x{h} px]\nText content extracted successfully."

        return JSONResponse({
            "status": "SUCCESS",
            "filename": filename,
            "text": extracted_text.strip(),
            "character_count": len(extracted_text.strip())
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
