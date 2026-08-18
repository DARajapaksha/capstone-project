"""
Diagnostic script: Run the face matching pipeline on the same photos
and print detailed intermediate state (face detection, crop sizes, per-pass scores).
Run from the ai-service directory:
  .\\venv\\Scripts\\python.exe diagnose_face.py <id_image_path> <selfie_image_path>
"""
import sys
import cv2
import numpy as np
import os

# Suppress TF noise
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# Allow running from any cwd
sys.path.insert(0, os.path.dirname(__file__))

from face_match import (
    decode_base64_image, compute_texture_variance,
    preprocess_id_photo, preprocess_selfie,
    detect_face_dnn, save_temp_image
)
import base64

def img_to_b64(path):
    with open(path, "rb") as f:
        data = f.read()
    ext = path.rsplit(".", 1)[-1].lower()
    return f"data:image/{ext};base64," + base64.b64encode(data).decode()

def run_deepface_pass(nic_face, selfie_face, backend, enforce):
    from deepface import DeepFace
    p1 = save_temp_image(nic_face)
    p2 = save_temp_image(selfie_face)
    try:
        r = DeepFace.verify(
            img1_path=p1, img2_path=p2,
            model_name="ArcFace", distance_metric="cosine",
            enforce_detection=enforce, detector_backend=backend
        )
        dist = r.get("distance", 1.0)
        score = round(max(0.0, 1.0 - dist), 4)
        return score, None
    except Exception as e:
        return 0.0, str(e)
    finally:
        for p in [p1, p2]:
            try: os.remove(p)
            except: pass

if len(sys.argv) < 3:
    print("Usage: python diagnose_face.py <id_image_path> <selfie_image_path>")
    sys.exit(1)

id_path     = sys.argv[1]
selfie_path = sys.argv[2]

print("\n" + "="*60)
print(" FACE MATCH DIAGNOSTIC")
print("="*60)

# Load raw images
nic_raw    = cv2.imread(id_path)
selfie_raw = cv2.imread(selfie_path)
print(f"\n[RAW] ID card image size:  {nic_raw.shape[1]}x{nic_raw.shape[0]}px")
print(f"[RAW] Selfie image size:   {selfie_raw.shape[1]}x{selfie_raw.shape[0]}px")

# Texture variance
nic_var    = compute_texture_variance(nic_raw)
selfie_var = compute_texture_variance(selfie_raw)
print(f"\n[QUALITY] ID card texture variance: {nic_var:.1f}")
print(f"[QUALITY] Selfie texture variance:  {selfie_var:.1f}")

# Preprocess
nic_pp    = preprocess_id_photo(nic_raw)
selfie_pp = preprocess_selfie(selfie_raw)
print(f"\n[PREPROC] ID card after preprocess: {nic_pp.shape[1]}x{nic_pp.shape[0]}px")
print(f"[PREPROC] Selfie after preprocess:  {selfie_pp.shape[1]}x{selfie_pp.shape[0]}px")

# Face detection
nic_face,    nic_found    = detect_face_dnn(nic_pp)
selfie_face, selfie_found = detect_face_dnn(selfie_pp)
print(f"\n[DETECT] ID card face found:  {nic_found}  → crop size: {nic_face.shape[1]}x{nic_face.shape[0]}px")
print(f"[DETECT] Selfie face found:   {selfie_found}  → crop size: {selfie_face.shape[1]}x{selfie_face.shape[0]}px")

# Save crops for visual inspection
cv2.imwrite("debug_nic_face_crop.jpg",    nic_face)
cv2.imwrite("debug_selfie_face_crop.jpg", selfie_face)
print("\n[SAVED] debug_nic_face_crop.jpg   — inspect this: is it the face region?")
print("[SAVED] debug_selfie_face_crop.jpg — inspect this: is it the face region?")

# Run passes
print("\n[MATCHING]")
score1, err1 = run_deepface_pass(nic_face, selfie_face, "opencv",     True)
print(f"  Pass 1 (opencv,     enforce=True):  score={score1*100:.1f}%  err={err1}")
score2, err2 = run_deepface_pass(nic_face, selfie_face, "retinaface", True)
print(f"  Pass 2 (retinaface, enforce=True):  score={score2*100:.1f}%  err={err2}")
score3, err3 = run_deepface_pass(nic_face, selfie_face, "opencv",     False)
print(f"  Pass 3 (opencv,     enforce=False): score={score3*100:.1f}%  err={err3}")

best = max(score1, score2, score3)
print(f"\n  ★ Best score: {best*100:.1f}%")
print("="*60 + "\n")
