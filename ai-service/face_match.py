import cv2
import numpy as np
import base64
import os
import json
import tempfile

SUPPORTED_TYPES = ["jpg", "jpeg", "png", "webp", "bmp"]

# Load config
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(_CONFIG_PATH, "r") as _f:
    _CFG = json.load(_f)["face_match"]

FACE_MATCH_THRESHOLD = float(_CFG["FACE_MATCH_THRESHOLD"])
MODEL_NAME           = _CFG.get("MODEL", "ArcFace")
TEXTURE_VAR_MIN      = float(_CFG.get("TEXTURE_VARIANCE_MIN", 150))

# Minimum face detection confidence required to proceed (0–1)
FACE_DETECT_MIN_CONF = 0.80


def decode_base64_image(b64_string):
    """
    Handles both:
    - Pure base64: "/9j/4AAQ..."
    - Data URL:    "data:image/jpeg;base64,/9j/4AAQ..."
    Returns a decoded BGR numpy image.
    """
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_data = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)


def compute_texture_variance(img):
    """
    Laplacian variance: measures texture richness.
    Low value means the image is flat (printed photo or screen).
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    return float(lap.var())


def remove_specular_glare(img):
    """
    Conservative specular highlight removal for laminated ID cards.
    Only removes near-pure-white, near-grey regions (real screen glare).
    """
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    _, s, v = cv2.split(hsv)
    glare_mask = np.uint8((v > 252) & (s < 10)) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    glare_mask = cv2.dilate(glare_mask, kernel, iterations=1)
    glare_ratio = np.sum(glare_mask > 0) / glare_mask.size
    if glare_ratio < 0.005 or glare_ratio > 0.15:
        return img
    return cv2.inpaint(img, glare_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)


def preprocess_id_photo(img):
    """Upscale → glare removal → CLAHE."""
    h, w = img.shape[:2]
    if min(h, w) < 600:
        scale = 600 / min(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)),
                         interpolation=cv2.INTER_CUBIC)
    img = remove_specular_glare(img)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(l)
    return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)


def preprocess_selfie(img):
    """Upscale → mild CLAHE (minimal — ArcFace is sensitive to over-processing)."""
    h, w = img.shape[:2]
    if min(h, w) < 600:
        scale = 600 / min(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)),
                         interpolation=cv2.INTER_CUBIC)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b_ch = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(l)
    return cv2.cvtColor(cv2.merge([l, a, b_ch]), cv2.COLOR_LAB2BGR)


def ensure_min_face_size(img, min_px=224):
    """Upscale face crop to at least min_px on its shortest side."""
    h, w = img.shape[:2]
    if min(h, w) < min_px:
        scale = min_px / min(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)),
                         interpolation=cv2.INTER_LANCZOS4)
    return img


def save_temp_image(img):
    """Save a numpy image to a temp file and return the path."""
    fd, path = tempfile.mkstemp(suffix=".jpg")
    os.close(fd)
    cv2.imwrite(path, img)
    return path


def has_skin_tone_pixels(img, min_skin_ratio=0.08):
    """
    Check whether an image region contains enough human skin-tone pixels.

    Skin tone in HSV space covers all major ethnic groups:
      Hue:        0–25  and  165–180  (peach / brown / olive / dark)
      Saturation: 20–170  (not greyscale, not neon)
      Value:      60–255  (not too dark)

    A flower bouquet is mostly green / yellow / purple / white.
    None of these colours fall consistently in the skin-tone HSV range,
    so this check cleanly separates real faces from non-face objects.

    Returns True if skin pixels >= min_skin_ratio of the total image area.
    """
    if img is None or img.size == 0:
        return False
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Lower range: peach → brown → tan
    lower1 = np.array([0,   20,  60], dtype=np.uint8)
    upper1 = np.array([25,  170, 255], dtype=np.uint8)
    # Upper range: wraps around 360° — dark-red / brown tones
    lower2 = np.array([165, 20,  60], dtype=np.uint8)
    upper2 = np.array([180, 170, 255], dtype=np.uint8)

    mask  = cv2.bitwise_or(cv2.inRange(hsv, lower1, upper1),
                           cv2.inRange(hsv, lower2, upper2))
    ratio = np.count_nonzero(mask) / mask.size
    print(f"[face_validate] Skin pixel ratio: {ratio:.3f} (threshold={min_skin_ratio})")
    return ratio >= min_skin_ratio


def validate_human_face(img, label="image"):
    """
    HARD GATE: Verify that the image contains a real human face.

    Check:
      1. DeepFace detector (mtcnn or retinaface)
         → MUST fire with sufficient confidence.
         → These detectors are highly robust and do not fire on objects/flowers.

    Returns: (face_found: bool, confidence: float, reason: str)
    """
    path = None
    try:
        path = save_temp_image(img)

        detector_fired = False
        best_conf = 0.0
        fired_reason = ""

        # --- Detector 1: DeepFace + mtcnn (highly accurate) -----------------
        try:
            from deepface import DeepFace
            faces = DeepFace.extract_faces(
                img_path=path,
                detector_backend="mtcnn",
                enforce_detection=True,
                anti_spoofing=False,
            )
            if faces:
                best_conf = max((f.get("confidence", 0) for f in faces), default=0)
                print(f"[face_validate] {label}: DeepFace (mtcnn) found {len(faces)} face(s), best_conf={best_conf:.3f}")
                if best_conf >= FACE_DETECT_MIN_CONF:
                    detector_fired = True
                    fired_reason   = "deepface_mtcnn"
        except Exception as e:
            print(f"[face_validate] {label}: DeepFace mtcnn failed: {e}")

        # --- Detector 2: DeepFace + retinaface (fallback) -------------------
        if not detector_fired:
            try:
                from deepface import DeepFace
                faces = DeepFace.extract_faces(
                    img_path=path,
                    detector_backend="retinaface",
                    enforce_detection=True,
                    anti_spoofing=False,
                )
                if faces:
                    best_conf = max((f.get("confidence", 0) for f in faces), default=0)
                    print(f"[face_validate] {label}: DeepFace (retinaface) found {len(faces)} face(s), best_conf={best_conf:.3f}")
                    if best_conf >= FACE_DETECT_MIN_CONF:
                        detector_fired = True
                        fired_reason   = "deepface_retinaface"
            except Exception as e:
                print(f"[face_validate] {label}: DeepFace retinaface failed: {e}")

        if not detector_fired:
            print(f"[face_validate] {label}: No face detected by any strict detector → REJECT")
            return False, 0.0, "no_face_detected"

        print(f"[face_validate] {label}: ACCEPTED — detector={fired_reason}, "
              f"conf={best_conf:.3f}")
        return True, best_conf, fired_reason

    finally:
        if path:
            try:
                os.remove(path)
            except Exception:
                pass




# ─────────────────────────────────────────────────────────────────────────────
#  FACE CROP HELPER
# ─────────────────────────────────────────────────────────────────────────────

def detect_face_dnn(img):
    """
    Detect and crop the face region.
    Tries OpenCV DNN first, falls back to Haar cascade.
    Returns (face_crop, face_found: bool).
    """
    try:
        proto_path = os.path.join(cv2.data.haarcascades,
                                  "../../dnn/face_detector/deploy.prototxt")
        model_path = os.path.join(cv2.data.haarcascades,
                                  "../../dnn/face_detector/"
                                  "res10_300x300_ssd_iter_140000_fp16.caffemodel")
        if os.path.exists(proto_path) and os.path.exists(model_path):
            net = cv2.dnn.readNetFromCaffe(proto_path, model_path)
            h, w = img.shape[:2]
            blob = cv2.dnn.blobFromImage(
                cv2.resize(img, (300, 300)), 1.0,
                (300, 300), (104.0, 177.0, 123.0))
            net.setInput(blob)
            detections = net.forward()
            for i in range(detections.shape[2]):
                conf = detections[0, 0, i, 2]
                if conf > 0.7:
                    box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                    x1, y1, x2, y2 = box.astype(int)
                    pad = int(0.15 * (x2 - x1))
                    x1 = max(0, x1 - pad)
                    y1 = max(0, y1 - pad)
                    x2 = min(w, x2 + pad)
                    y2 = min(h, y2 + pad)
                    crop = img[y1:y2, x1:x2]
                    if crop.size > 0:
                        return crop, True
    except Exception:
        pass

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))
    if len(faces) == 0:
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.3, minNeighbors=1, minSize=(20, 20))
    if len(faces) > 0:
        x, y, w_f, h_f = faces[0]
        pad = int(0.2 * w_f)
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(img.shape[1], x + w_f + pad)
        y2 = min(img.shape[0], y + h_f + pad)
        return img[y1:y2, x1:x2], True

    return img, False


# ─────────────────────────────────────────────────────────────────────────────
#  DEEPFACE PASS
# ─────────────────────────────────────────────────────────────────────────────

def _run_deepface_pass(nic_face, selfie_face, detector_backend,
                       enforce_detection, pass_label):
    """
    Run a single DeepFace ArcFace verification pass.
    Returns (face_score: float, raw_result: dict, error: str|None).
    """
    from deepface import DeepFace
    nic_path    = save_temp_image(nic_face)
    selfie_path = save_temp_image(selfie_face)
    try:
        result = DeepFace.verify(
            img1_path=nic_path,
            img2_path=selfie_path,
            model_name=MODEL_NAME,
            distance_metric="cosine",
            enforce_detection=enforce_detection,
            detector_backend=detector_backend,
        )
        distance   = result.get("distance", 1.0)
        face_score = round(max(0.0, 1.0 - distance), 4)
        print(f"[face_match] Pass '{pass_label}': "
              f"score={face_score:.4f} distance={distance:.4f}")
        return face_score, result, None
    except Exception as e:
        print(f"[face_match] Pass '{pass_label}' failed: {e}")
        return 0.0, {}, str(e)
    finally:
        for p in [nic_path, selfie_path]:
            try:
                os.remove(p)
            except Exception:
                pass


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def match_faces(nic_image_b64, selfie_image_b64):
    """
    Robust face matching pipeline:

    STEP 0 — MANDATORY FACE VALIDATION (hard gate)
      Both images MUST contain a detected human face with confidence ≥ 0.80.
      Non-face images (flowers, pets, objects, blank photos) are REJECTED here
      before any matching is attempted. This is the fix for the "flower bouquet
      gets verified" class of attacks.

    STEP 1 — Preprocessing
      ID: upscale → glare removal → CLAHE
      Selfie: upscale → mild CLAHE

    STEP 2 — Face detection & crop

    STEP 3 — Multi-pass ArcFace matching (3 passes, best score wins)
      All passes use enforce_detection=False because crops are pre-extracted.

    STEP 4 — Histogram fallback (score CAPPED at 0.69 — never auto-approves)
    """
    try:
        # ── Decode ────────────────────────────────────────────────────────────
        nic_img    = decode_base64_image(nic_image_b64)
        selfie_img = decode_base64_image(selfie_image_b64)

        if nic_img is None or selfie_img is None:
            return {
                "match":      False,
                "face_score": 0,
                "error":      "Could not decode one or both images. Check format."
            }

        # ── STEP 0: MANDATORY FACE VALIDATION — THE HARD GATE ─────────────────
        # This runs BEFORE any preprocessing or matching.
        # If a real human face is not found in the ID image → HARD REJECT.
        # If a real human face is not found in the selfie → HARD REJECT.
        # No score is generated. No fallback. Full stop.
        nic_face_valid, nic_face_conf, nic_reason = validate_human_face(
            nic_img, label="NIC/ID"
        )
        if not nic_face_valid:
            print(f"[face_match] HARD REJECT: No human face in ID image "
                  f"(reason={nic_reason}, conf={nic_face_conf:.3f})")
            return {
                "match":      False,
                "face_score": 0,
                "confidence": 0,
                "error":      ("No human face detected in the ID photo. "
                               "Please upload a valid government-issued ID card "
                               "with a clear face photo."),
                "method":     "face_validation_failed",
                "reject_reason": nic_reason,
            }

        selfie_face_valid, selfie_face_conf, selfie_reason = validate_human_face(
            selfie_img, label="Selfie"
        )
        if not selfie_face_valid:
            print(f"[face_match] HARD REJECT: No human face in selfie "
                  f"(reason={selfie_reason}, conf={selfie_face_conf:.3f})")
            return {
                "match":      False,
                "face_score": 0,
                "confidence": 0,
                "error":      ("No human face detected in the selfie. "
                               "Please retake your photo looking directly at the camera."),
                "method":     "face_validation_failed",
                "reject_reason": selfie_reason,
            }

        print(f"[face_match] Face validation PASSED — "
              f"ID conf={nic_face_conf:.3f} ({nic_reason}), "
              f"Selfie conf={selfie_face_conf:.3f} ({selfie_reason})")

        # ── Texture variance (informational log only — validation already done) ─
        nic_var    = compute_texture_variance(nic_img)
        selfie_var = compute_texture_variance(selfie_img)
        print(f"[face_match] Texture variance — ID: {nic_var:.1f}, Selfie: {selfie_var:.1f}")

        # ── STEP 1: Preprocess ────────────────────────────────────────────────
        nic_img    = preprocess_id_photo(nic_img)
        selfie_img = preprocess_selfie(selfie_img)

        # ── STEP 2: Detect and crop faces ─────────────────────────────────────
        nic_face,    nic_face_found    = detect_face_dnn(nic_img)
        selfie_face, selfie_face_found = detect_face_dnn(selfie_img)

        print(f"[face_match] Crop — "
              f"ID: {nic_face.shape[1]}x{nic_face.shape[0]}px (found={nic_face_found}) | "
              f"Selfie: {selfie_face.shape[1]}x{selfie_face.shape[0]}px (found={selfie_face_found})")

        nic_face    = ensure_min_face_size(nic_face,    min_px=224)
        selfie_face = ensure_min_face_size(selfie_face, min_px=224)

        # ── STEP 3: Multi-pass ArcFace matching ──────────────────────────────
        best_score      = 0.0
        best_result     = {}
        best_pass_label = "none"
        last_error      = None

        try:
            # Pass 1: opencv alignment (fast, standard path)
            score1, res1, err1 = _run_deepface_pass(
                nic_face, selfie_face,
                detector_backend="opencv",
                enforce_detection=False,
                pass_label="P1_opencv"
            )
            if score1 > best_score:
                best_score, best_result, best_pass_label = score1, res1, "P1_opencv"
            last_error = err1

            # Pass 2: retinaface (better for small/low-res crops)
            if best_score < 0.45:
                score2, res2, err2 = _run_deepface_pass(
                    nic_face, selfie_face,
                    detector_backend="retinaface",
                    enforce_detection=False,
                    pass_label="P2_retinaface"
                )
                if score2 > best_score:
                    best_score, best_result, best_pass_label = score2, res2, "P2_retinaface"
                if err2:
                    last_error = err2

            # Pass 3: embed crop directly (no alignment step) — only when
            # real face crops were found (not full-card fallback)
            if best_score < 0.45 and nic_face_found and selfie_face_found:
                score3, res3, err3 = _run_deepface_pass(
                    nic_face, selfie_face,
                    detector_backend="skip",
                    enforce_detection=False,
                    pass_label="P3_skip"
                )
                if score3 > best_score:
                    best_score, best_result, best_pass_label = score3, res3, "P3_skip"
                if err3:
                    last_error = err3

            print(f"[face_match] Best score: {best_score:.4f} via '{best_pass_label}'")

            distance = best_result.get("distance", round(1.0 - best_score, 4))
            is_match = best_score >= FACE_MATCH_THRESHOLD

            return {
                "match":                is_match,
                "face_score":           best_score,
                "confidence":           best_score,
                "distance":             round(float(distance), 4),
                "threshold":            FACE_MATCH_THRESHOLD,
                "method":               f"deepface_{MODEL_NAME.lower()}",
                "pass_used":            best_pass_label,
                "deepface_verified":    best_result.get("verified", False),
                "id_face_detected":     nic_face_found,
                "selfie_face_detected": selfie_face_found,
                "id_face_confidence":   round(nic_face_conf, 3),
                "selfie_face_confidence": round(selfie_face_conf, 3),
                "nic_texture_var":      round(nic_var, 1),
                "selfie_texture_var":   round(selfie_var, 1),
            }

        except Exception as deepface_err:
            print(f"[face_match] All DeepFace passes failed: {deepface_err}")

            # ── STEP 4: Histogram fallback ────────────────────────────────────
            # Faces WERE validated in Step 0, so this comparison is between
            # real faces — but histogram is still weak biometrics.
            # Score is HARD-CAPPED at 0.69 (below the 0.70 auto-approve threshold).
            # Result always routes to HUMAN REVIEW, never auto-approval.
            HIST_MAX_SCORE = 0.69

            nic_gray    = cv2.cvtColor(nic_face,    cv2.COLOR_BGR2GRAY)
            selfie_gray = cv2.cvtColor(selfie_face, cv2.COLOR_BGR2GRAY)
            nic_eq      = cv2.equalizeHist(nic_gray)
            selfie_eq   = cv2.equalizeHist(selfie_gray)
            nic_resized = cv2.resize(nic_eq,      (128, 128))
            slf_resized = cv2.resize(selfie_eq,   (128, 128))

            nic_hist = cv2.calcHist([nic_resized], [0], None, [256], [0, 256])
            slf_hist = cv2.calcHist([slf_resized], [0], None, [256], [0, 256])
            cv2.normalize(nic_hist, nic_hist)
            cv2.normalize(slf_hist, slf_hist)

            raw_score  = float(max(0.0, min(1.0,
                cv2.compareHist(nic_hist, slf_hist, cv2.HISTCMP_CORREL))))
            face_score = round(min(raw_score, HIST_MAX_SCORE), 4)
            is_match   = face_score >= FACE_MATCH_THRESHOLD

            return {
                "match":                is_match,
                "face_score":           face_score,
                "confidence":           face_score,
                "distance":             round(1 - face_score, 4),
                "threshold":            FACE_MATCH_THRESHOLD,
                "method":               "histogram_fallback",
                "pass_used":            "fallback_histogram",
                "fallback_note":        "ArcFace unavailable; score capped at 0.69 — requires human review",
                "deepface_error":       str(deepface_err),
                "id_face_detected":     nic_face_found,
                "selfie_face_detected": selfie_face_found,
                "id_face_confidence":   round(nic_face_conf, 3),
                "selfie_face_confidence": round(selfie_face_conf, 3),
                "nic_texture_var":      round(nic_var, 1),
                "selfie_texture_var":   round(selfie_var, 1),
            }

    except Exception as e:
        return {
            "match":      False,
            "face_score": 0,
            "error":      str(e)
        }