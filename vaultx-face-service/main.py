import base64
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="VaultX Face Verification Service", version="1.0.0")

class FaceMatchRequest(BaseModel):
    registeredImage: str
    candidateImage: str

@app.get("/health")
def health():
    return {"status": "UP", "service": "vaultx-face-service"}

@app.post("/api/v1/face/match")
async def face_match(request: FaceMatchRequest):
    try:
        reg_raw = request.registeredImage.split(",")[-1] if "," in request.registeredImage else request.registeredImage
        cand_raw = request.candidateImage.split(",")[-1] if "," in request.candidateImage else request.candidateImage

        reg = cv2.imdecode(
            np.frombuffer(base64.b64decode(reg_raw), np.uint8),
            cv2.IMREAD_COLOR
        )
        cand = cv2.imdecode(
            np.frombuffer(base64.b64decode(cand_raw), np.uint8),
            cv2.IMREAD_COLOR
        )

        if reg is None or cand is None:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

        import sface_matcher
        matched, score = sface_matcher.is_match(reg, cand)

        return JSONResponse({
            "matched": matched,
            "score": score,
            "status": "SUCCESS"
        })
    except ValueError as ve:
        return JSONResponse(
            status_code=400,
            content={"matched": False, "score": 0.0, "message": str(ve)}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face match internal error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
