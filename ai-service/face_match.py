import cv2
import numpy as np
import base64
import os
import json
import tempfile

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
    Returns a decoded BGR numpy image.
    """
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_data = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img


def preprocess_id_photo(img):
    """
    Enhance an ID card photo for better face detection:
    - Boost contrast with CLAHE
    - Sharpen the image
    - Upscale small images to aid detection
    """
    # Upscale if image is small (typical ID card photo region)
    h, w = img.shape[:2]
    if w < 400:
        scale = 400 / w
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

    # Apply CLAHE for contrast enhancement (great for dark or washed-out ID photos)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    return img


def crop_face_region(img):
    """
    Attempt to detect and crop just the face region using Haar cascades.
    Falls back to the full image if no face is detected.
    Uses multiple cascade passes with relaxed parameters for low-quality images.
    """
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Attempt 1: Standard detection
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))

    # Attempt 2: Relaxed (for low-res / angled faces)
    if len(faces) == 0:
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=1, minSize=(20, 20))

    if len(faces) > 0:
        x, y, w, h = faces[0]
        # Add a small margin around the face
        pad = int(0.2 * w)
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(img.shape[1], x + w + pad)
        y2 = min(img.shape[0], y + h + pad)
        return img[y1:y2, x1:x2], True

    return img, False  # Return full image if no face detected


def save_temp_image(img):
    """Save a numpy image to a temp file and return the path."""
    fd, path = tempfile.mkstemp(suffix=".jpg")
    os.close(fd)
    cv2.imwrite(path, img)
    return path


def match_faces(nic_image_b64, selfie_image_b64):
    """
    Two-stage face matching pipeline:
    1. Preprocess both images (enhance, crop face region)
    2. Use DeepFace (deep neural network) for face comparison
       Falls back to SSIM histogram comparison if DeepFace fails.
    """
    try:
        # --- Decode images ---
        nic_img = decode_base64_image(nic_image_b64)
        selfie_img = decode_base64_image(selfie_image_b64)

        if nic_img is None or selfie_img is None:
            return {
                "match": False,
                "face_score": 0,
                "error": "Could not decode one or both images. Check format."
            }

        # --- Preprocess ---
        nic_img = preprocess_id_photo(nic_img)
        selfie_img = preprocess_id_photo(selfie_img)

        # --- Crop to face region if possible ---
        nic_face, nic_face_found = crop_face_region(nic_img)
        selfie_face, selfie_face_found = crop_face_region(selfie_img)

        # --- Try DeepFace (primary method: deep neural network) ---
        try:
            from deepface import DeepFace

            nic_path = save_temp_image(nic_face)
            selfie_path = save_temp_image(selfie_face)

            try:
                # Use VGG-Face model with cosine distance — robust to low-resolution images
                result = DeepFace.verify(
                    img1_path=nic_path,
                    img2_path=selfie_path,
                    model_name="VGG-Face",
                    distance_metric="cosine",
                    enforce_detection=False,  # Don't fail if face not detected cleanly
                    detector_backend="skip",   # We already cropped the face above
                )

                distance = result.get("distance", 1.0)
                # Convert cosine distance (0=same, 1=different) to a 0-100 score
                face_score = round(max(0.0, 1.0 - distance), 4)
                is_match = face_score >= FACE_MATCH_THRESHOLD

                return {
                    "match": is_match,
                    "face_score": face_score,
                    "confidence": face_score,
                    "distance": round(distance, 4),
                    "threshold": FACE_MATCH_THRESHOLD,
                    "method": "deepface_vggface",
                    "id_face_detected": nic_face_found,
                    "selfie_face_detected": selfie_face_found,
                }
            finally:
                # Cleanup temp files
                for p in [nic_path, selfie_path]:
                    try:
                        os.remove(p)
                    except Exception:
                        pass

        except Exception as deepface_err:
            print(f"[face_match] DeepFace failed, falling back to histogram: {deepface_err}")

            # --- Fallback: Enhanced histogram comparison ---
            nic_gray = cv2.cvtColor(nic_face, cv2.COLOR_BGR2GRAY)
            selfie_gray = cv2.cvtColor(selfie_face, cv2.COLOR_BGR2GRAY)

            # Normalize brightness so lighting differences don't kill the score
            nic_eq = cv2.equalizeHist(nic_gray)
            selfie_eq = cv2.equalizeHist(selfie_gray)

            # Resize both to same dimensions
            nic_resized = cv2.resize(nic_eq, (128, 128))
            selfie_resized = cv2.resize(selfie_eq, (128, 128))

            nic_hist = cv2.calcHist([nic_resized], [0], None, [256], [0, 256])
            selfie_hist = cv2.calcHist([selfie_resized], [0], None, [256], [0, 256])

            cv2.normalize(nic_hist, nic_hist)
            cv2.normalize(selfie_hist, selfie_hist)

            score = cv2.compareHist(nic_hist, selfie_hist, cv2.HISTCMP_CORREL)
            face_score = round(float(max(0.0, min(1.0, score))), 4)
            is_match = face_score >= FACE_MATCH_THRESHOLD

            return {
                "match": is_match,
                "face_score": face_score,
                "confidence": face_score,
                "distance": round(1 - face_score, 4),
                "threshold": FACE_MATCH_THRESHOLD,
                "method": "histogram_fallback",
                "deepface_error": str(deepface_err),
                "id_face_detected": nic_face_found,
                "selfie_face_detected": selfie_face_found,
            }

    except Exception as e:
        return {
            "match": False,
            "face_score": 0,
            "error": str(e)
        }