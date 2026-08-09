import hashlib
import cv2
import numpy as np
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="VaultX Duplicate Document Detection Service", version="1.0.0")

class ExistingDocument(BaseModel):
    id: str
    filename: str
    sha256: str
    phash: Optional[str] = None
    textContent: Optional[str] = None

class DeduplicationCheckRequest(BaseModel):
    existingDocuments: List[ExistingDocument]

def compute_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

def compute_dhash(image_bytes: bytes, hash_size: int = 8) -> Optional[str]:
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return None
        resized = cv2.resize(img, (hash_size + 1, hash_size))
        diff = resized[:, 1:] > resized[:, :-1]
        return "".join(["1" if b else "0" for b in diff.flatten()])
    except Exception:
        return None

def hamming_distance(h1: str, h2: str) -> int:
    if not h1 or not h2 or len(h1) != len(h2):
        return 999
    return sum(c1 != c2 for c1, c2 in zip(h1, h2))

def text_jaccard_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / float(len(union)) if union else 0.0

@app.get("/health")
def health():
    return {"status": "UP", "service": "vaultx-deduplication-service"}

@app.post("/api/v1/dedup/analyze")
async def analyze_document(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        sha256_hash = compute_sha256(contents)
        phash = compute_dhash(contents)

        return JSONResponse({
            "status": "SUCCESS",
            "filename": file.filename,
            "sha256": sha256_hash,
            "phash": phash,
            "sizeBytes": len(contents)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze document: {str(e)}")

@app.post("/api/v1/dedup/check-duplicate")
async def check_duplicate(
    file: UploadFile = File(...),
    existing_hashes_json: Optional[str] = Form(None)
):
    try:
        contents = await file.read()
        file_sha256 = compute_sha256(contents)
        file_phash = compute_dhash(contents)

        is_exact_duplicate = False
        is_near_duplicate = False
        matched_document_id = None
        matched_filename = None
        similarity_score = 0.0
        match_type = "NONE"

        # Check against passed existing signatures
        if existing_hashes_json:
            import json
            try:
                existing_docs = json.loads(existing_hashes_json)
                for doc in existing_docs:
                    target_sha256 = doc.get("sha256", "")
                    target_phash = doc.get("phash", "")
                    doc_id = doc.get("id", "")
                    fname = doc.get("filename", "")

                    # 1. Exact SHA-256 Match
                    if target_sha256 and target_sha256.lower() == file_sha256.lower():
                        is_exact_duplicate = True
                        matched_document_id = doc_id
                        matched_filename = fname
                        similarity_score = 1.0
                        match_type = "EXACT_SHA256"
                        break

                    # 2. Perceptual Image Hash Match (Hamming distance <= 5 out of 64 bits)
                    if file_phash and target_phash:
                        dist = hamming_distance(file_phash, target_phash)
                        if dist <= 5:
                            is_near_duplicate = True
                            matched_document_id = doc_id
                            matched_filename = fname
                            similarity_score = round(1.0 - (dist / 64.0), 3)
                            match_type = "NEAR_DUPLICATE_PHASH"
                            break
            except Exception as pe:
                print(f"Error parsing existing hashes: {pe}")

        return JSONResponse({
            "isDuplicate": is_exact_duplicate or is_near_duplicate,
            "isExactDuplicate": is_exact_duplicate,
            "isNearDuplicate": is_near_duplicate,
            "matchType": match_type,
            "matchedDocumentId": matched_document_id,
            "matchedFilename": matched_filename,
            "similarityScore": similarity_score,
            "fileHash": {
                "sha256": file_sha256,
                "phash": file_phash
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deduplication check failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
