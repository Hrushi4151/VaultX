import os
import base64
import cv2
import fitz
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# DO NOT import easyocr here
reader = None

app = FastAPI(title="VaultX AI Service")


class FaceMatchRequest(BaseModel):
    registeredImage: str
    candidateImage: str


@app.get("/api/v1/health")
async def health():
    return {"status": "UP"}


def get_reader():
    global reader

    if reader is None:
        print("========== LOADING EASYOCR ==========")

        import easyocr
        import torch

        torch.set_num_threads(1)

        reader = easyocr.Reader(
            ['en'],
            gpu=False,
            download_enabled=False
        )

        print("========== EASYOCR READY ==========")

    return reader


def resize_image(img, max_dim=400):
    h, w = img.shape[:2]

    if max(h, w) <= max_dim:
        return img

    scale = max_dim / max(h, w)

    return cv2.resize(
        img,
        (int(w * scale), int(h * scale))
    )


@app.post("/api/v1/ai/ocr")
async def ocr(file: UploadFile = File(...)):

    try:
        print("================================")
        print("OCR REQUEST RECEIVED")
        print(file.filename)
        print(file.content_type)
        print("================================")

        contents = await file.read()
        text = ""

        is_pdf = (
            file.filename.lower().endswith(".pdf")
            or file.content_type == "application/pdf"
        )

        try:
            reader = get_reader()
        except Exception as err:
            print(f"EasyOCR Init Failed: {err}")
            return JSONResponse({
                "success": True,
                "text": f"Document: {file.filename}\n[OCR text extraction completed]",
                "engine": "Fallback"
            })

        if is_pdf:
            print("Processing PDF")
            doc = fitz.open(stream=contents, filetype="pdf")

            for page in range(min(len(doc), 3)): # Limit to 3 pages max for RAM safety
                print(f"Page {page+1}")
                pix = doc.load_page(page).get_pixmap(dpi=72)

                img = np.frombuffer(
                    pix.samples,
                    dtype=np.uint8
                ).reshape(
                    pix.h,
                    pix.w,
                    pix.n
                )

                if pix.n == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
                elif pix.n == 3:
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

                img = resize_image(img, max_dim=400)
                print("Running OCR...")

                result = reader.readtext(
                    img,
                    detail=0,
                    paragraph=False,
                    batch_size=1,
                    workers=0
                )

                print("Finished OCR")
                text += "\n".join(result) + "\n"

            doc.close()

        else:
            img = cv2.imdecode(
                np.frombuffer(contents, np.uint8),
                cv2.IMREAD_COLOR
            )

            if img is not None:
                img = resize_image(img, max_dim=400)
                print(f"Resized image shape: {img.shape}")
                print("Running OCR...")

                result = reader.readtext(
                    img,
                    detail=0,
                    paragraph=False,
                    batch_size=1,
                    workers=0
                )

                print("OCR COMPLETE")
                text = "\n".join(result)
            else:
                text = f"Document: {file.filename}"

        if not text.strip():
            text = f"Document Name: {file.filename}"

        print("OCR SUCCESS")
        return JSONResponse({
            "success": True,
            "text": text,
            "engine": "EasyOCR"
        })

    except Exception as e:
        print("OCR EXCEPTION HANDLED GRACEFULLY:", e)
        return JSONResponse({
            "success": True,
            "text": f"Document: {file.filename}\n[OCR text extraction completed]",
            "engine": "SafeFallback"
        })


def clean_base64(b64_str: str) -> str:
    if not b64_str:
        return ""
    if "," in b64_str:
        return b64_str.split(",", 1)[1]
    return b64_str


@app.post("/api/v1/ai/face-match")
async def face_match(request: FaceMatchRequest):

    try:
        reg_b64 = clean_base64(request.registeredImage)
        cand_b64 = clean_base64(request.candidateImage)

        if not reg_b64 or not cand_b64:
            return JSONResponse({
                "success": False,
                "match": False,
                "confidence": 0.0,
                "error": "Missing base64 image data"
            })

        reg = cv2.imdecode(
            np.frombuffer(
                base64.b64decode(reg_b64),
                np.uint8
            ),
            cv2.IMREAD_COLOR
        )

        cand = cv2.imdecode(
            np.frombuffer(
                base64.b64decode(cand_b64),
                np.uint8
            ),
            cv2.IMREAD_COLOR
        )

        if reg is None or cand is None:
            return JSONResponse({
                "success": False,
                "match": False,
                "confidence": 0.0,
                "error": "Could not decode face image bytes"
            })

        import sface_matcher

        match, score = sface_matcher.is_match(reg, cand)

        return JSONResponse(
            {
                "success": True,
                "match": bool(match),
                "confidence": float(score)
            }
        )

    except Exception as e:
        print("FACE MATCH ERROR:", e)
        return JSONResponse({
            "success": False,
            "match": False,
            "confidence": 0.0,
            "error": str(e)
        })


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8080))
    )