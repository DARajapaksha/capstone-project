import cv2
import numpy as np
import base64
import re
import os
import json

SUPPORTED_TYPES = ["jpg", "jpeg", "png", "webp", "bmp"]

# Load threshold from config
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(_CONFIG_PATH, "r") as _f:
    _CFG = json.load(_f)["face_match"]

FACE_MATCH_THRESHOLD = float(_CFG["FACE_MATCH_THRESHOLD"])


def decode_base64_image(b64_string):
    """
    Handles both:
    - Pure base64: "/9j/4AAQ..."
    - Data URL: "data:image/jpeg;base64,/9j/4AAQ..."
    """
    # Strip data URL prefix if present
    # e.g. "data:image/png;base64,..." → just the base64 part
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]

    img_data = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

def match_faces(nic_image_b64, selfie_image_b64):
    try:
        nic_img = decode_base64_image(nic_image_b64)
        selfie_img = decode_base64_image(selfie_image_b64)

        if nic_img is None or selfie_img is None:
            return {
                "match": False,
                "face_score": 0,
                "error": "Could not decode one or both images. Check format."
            }

        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

        nic_gray = cv2.cvtColor(nic_img, cv2.COLOR_BGR2GRAY)
        selfie_gray = cv2.cvtColor(selfie_img, cv2.COLOR_BGR2GRAY)

        nic_faces = face_cascade.detectMultiScale(nic_gray, 1.1, 4)
        selfie_faces = face_cascade.detectMultiScale(selfie_gray, 1.1, 4)

        if len(nic_faces) == 0 or len(selfie_faces) == 0:
            return {
                "match": False,
                "face_score": 0,
                "error": "No face detected in one or both images"
            }

        x, y, w, h = nic_faces[0]
        nic_face = cv2.resize(nic_gray[y:y+h, x:x+w], (100, 100))

        x, y, w, h = selfie_faces[0]
        selfie_face = cv2.resize(selfie_gray[y:y+h, x:x+w], (100, 100))

        nic_hist = cv2.calcHist([nic_face], [0], None, [256], [0, 256])
        selfie_hist = cv2.calcHist([selfie_face], [0], None, [256], [0, 256])

        cv2.normalize(nic_hist, nic_hist)
        cv2.normalize(selfie_hist, selfie_hist)

        score = cv2.compareHist(nic_hist, selfie_hist, cv2.HISTCMP_CORREL)
        face_score = round(float(score), 4)
        # Clamp to [0, 1] — histogram correlation can return slightly negative values
        face_score = max(0.0, min(1.0, face_score))
        is_match = face_score > FACE_MATCH_THRESHOLD

        return {
            "match":      is_match,
            "face_score": face_score,
            "confidence": face_score,   # standardized alias used by Node.js gateway
            "distance":   round(1 - face_score, 4),
            "threshold":  FACE_MATCH_THRESHOLD
        }

    except Exception as e:
        return {
            "match": False,
            "face_score": 0,
            "error": str(e)
        }