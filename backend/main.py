from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import joblib
import numpy as np
import io
import librosa

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: in production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
with open("saved_model.pkl", "rb") as f:
    model = joblib.load(f)


# ---------- Feature Extraction (same as training) ----------
def extract_features_from_bytes(audio_bytes, n_mfcc=40):
    # Load audio from memory
    x, sr = librosa.load(io.BytesIO(audio_bytes), res_type="kaiser_fast")

    # Extract MFCC
    mfcc = librosa.feature.mfcc(y=x, sr=sr, n_mfcc=n_mfcc)

    # Mean + Std (same as training script)
    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_std = np.std(mfcc, axis=1)

    # Concatenate into one vector
    feature = np.hstack((mfcc_mean, mfcc_std))

    return feature.reshape(1, -1)


# ---------- API Route ----------
@app.post("/classify")
async def classify_audio(file: UploadFile = File(...)):
    contents = await file.read()
    features = extract_features_from_bytes(contents)

    # Predict probabilities
    probs = model.predict_proba(features)[0]
    result = {
        "human_prob": float(probs[0]),
        "ai_prob": float(probs[1]),
    }
    return result


# ---------- Run ----------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
