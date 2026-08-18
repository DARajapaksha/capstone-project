import cv2
import numpy as np
import base64
import os
import json
import urllib.request
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

# ── Load configuration ────────────────────────────────────────────────────────
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(_CONFIG_PATH, "r") as _f:
    _CFG = json.load(_f)["liveness"]

EAR_THRESHOLD              = float(_CFG["EAR_THRESHOLD"])
CONSECUTIVE_FRAMES         = int(_CFG["CONSECUTIVE_FRAMES"])
MOVEMENT_THRESHOLD         = int(_CFG["MOVEMENT_THRESHOLD"])
LIVENESS_WINDOW_SECONDS    = int(_CFG["LIVENESS_WINDOW_SECONDS"])
MIN_FACE_DETECT_CONF       = float(_CFG["MIN_FACE_DETECTION_CONFIDENCE"])
MIN_FACE_PRESENCE_CONF     = float(_CFG["MIN_FACE_PRESENCE_CONFIDENCE"])
MIN_TRACKING_CONF          = float(_CFG["MIN_TRACKING_CONFIDENCE"])
LBP_UNIFORMITY_THRESHOLD   = float(_CFG["LBP_UNIFORMITY_THRESHOLD"])
TEXTURE_VARIANCE_THRESHOLD = float(_CFG["TEXTURE_VARIANCE_THRESHOLD"])
REFLECTION_SCORE_THRESHOLD = float(_CFG["REFLECTION_SCORE_THRESHOLD"])
MIN_ANTI_SPOOF_FRAMES      = int(_CFG["MIN_ANTI_SPOOF_FRAMES"])

# ── Model setup ───────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "face_landmarker.task")

if not os.path.exists(MODEL_PATH):
    print("Downloading face_landmarker.task model...")
    url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    urllib.request.urlretrieve(url, MODEL_PATH)
    print("Model downloaded.")

# MediaPipe 468-point face mesh — standard ocular landmark indices
RIGHT_EYE = [33,  159, 158, 133, 153, 145]
LEFT_EYE  = [263, 385, 386, 362, 374, 380]

# ── Face region landmarks (for cropping the face for texture analysis) ────────
FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361,
             288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149,
             150, 136, 172, 58,  132, 93,  234, 127, 162, 21,  54,
             103, 67,  109]


def calculate_ear(landmarks, eye_indices, image_w, image_h):
    """
    Eye Aspect Ratio (EAR) — geometric algorithm for detecting blinks.
    EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
    Drops rapidly when eyelids close; remains stable when eyes are open.
    """
    points = []
    for idx in eye_indices:
        lm = landmarks[idx]
        points.append((lm.x * image_w, lm.y * image_h))

    A = np.linalg.norm(np.array(points[1]) - np.array(points[5]))
    B = np.linalg.norm(np.array(points[2]) - np.array(points[4]))
    C = np.linalg.norm(np.array(points[0]) - np.array(points[3]))
    if C == 0:
        return 0.0
    return (A + B) / (2.0 * C)


def decode_base64_image(b64_string):
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_data = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)


def crop_face_from_landmarks(frame, landmarks, w, h, padding=0.15):
    """
    Crop the face region from an image using MediaPipe landmark bounding box.
    Returns the cropped face region or None if region is too small.
    """
    xs = [landmarks[i].x * w for i in FACE_OVAL]
    ys = [landmarks[i].y * h for i in FACE_OVAL]

    x1 = max(0, int(min(xs) - padding * w))
    y1 = max(0, int(min(ys) - padding * h))
    x2 = min(w, int(max(xs) + padding * w))
    y2 = min(h, int(max(ys) + padding * h))

    if (x2 - x1) < 30 or (y2 - y1) < 30:
        return None
    return frame[y1:y2, x1:x2]


def compute_lbp_uniformity(gray_img):
    """
    Compute Local Binary Pattern (LBP) uniformity score.

    LBP encodes texture by comparing each pixel to its 8 neighbours.
    Real skin has rich, irregular micro-texture producing high variance LBP.
    Flat digital screens and printed photos produce highly UNIFORM LBP
    patterns (most pixels share the same pattern → high uniformity score).

    A high uniformity score (close to 1.0) means the texture is flat/fake.
    A low score (closer to 0) means the texture is rich/real.

    Returns: uniformity score in [0, 1].  High = suspicious (likely spoof).
    """
    radius = 1
    n_points = 8

    # Resize for consistent computation
    resized = cv2.resize(gray_img, (64, 64))
    h, w = resized.shape
    lbp = np.zeros_like(resized, dtype=np.uint8)

    for y in range(radius, h - radius):
        for x in range(radius, w - radius):
            center = int(resized[y, x])
            binary = 0
            for i in range(n_points):
                angle = 2 * np.pi * i / n_points
                nx = int(round(x + radius * np.cos(angle)))
                ny = int(round(y - radius * np.sin(angle)))
                nx = max(0, min(w - 1, nx))
                ny = max(0, min(h - 1, ny))
                if int(resized[ny, nx]) >= center:
                    binary |= (1 << i)
            lbp[y, x] = binary

    # Uniformity: fraction of pixels with the same dominant LBP value
    hist, _ = np.histogram(lbp, bins=256, range=(0, 256))
    hist = hist.astype(float)
    total = hist.sum()
    if total == 0:
        return 1.0
    uniformity = (hist.max() / total)
    return float(uniformity)


def compute_texture_variance(gray_img):
    """
    Compute Laplacian variance — a measure of image sharpness / texture richness.
    Real faces have high variance due to skin texture, pores, and micro-features.
    Phone screens and printed photos appear overly smooth or have repetitive
    pixel patterns, yielding lower variance.

    Returns: float — higher is richer texture (real face).
    """
    resized = cv2.resize(gray_img, (128, 128))
    lap = cv2.Laplacian(resized, cv2.CV_64F)
    return float(lap.var())


def compute_specular_reflection_score(bgr_img):
    """
    Detect unnatural specular reflection patterns typical of screens.

    Screens and glossy photos produce large, uniform high-intensity regions
    (flat specular highlights). Real faces have small, irregular catchlights.

    Method:
      1. Convert to grayscale
      2. Threshold at 240 (very bright pixels)
      3. Find connected bright regions
      4. If ANY single region covers > 15% of the face area → screen-like reflection

    Returns: score in [0, 1] where > REFLECTION_SCORE_THRESHOLD = suspicious.
    """
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (128, 128))
    total_pixels = resized.shape[0] * resized.shape[1]

    _, bright_mask = cv2.threshold(resized, 240, 255, cv2.THRESH_BINARY)
    num_labels, _, stats, _ = cv2.connectedComponentsWithStats(bright_mask, connectivity=8)

    max_region_ratio = 0.0
    for label in range(1, num_labels):
        area = stats[label, cv2.CC_STAT_AREA]
        ratio = area / total_pixels
        if ratio > max_region_ratio:
            max_region_ratio = ratio

    return float(max_region_ratio)


def is_frame_spoof(face_crop):
    """
    Apply all texture-based anti-spoofing checks to a cropped face region.

    Returns: (is_spoof: bool, details: dict)
    """
    if face_crop is None:
        return False, {"reason": "no_face_crop"}

    gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)

    lbp_score   = compute_lbp_uniformity(gray)
    tex_var     = compute_texture_variance(gray)
    refl_score  = compute_specular_reflection_score(face_crop)

    # Spoof if:
    #   - LBP is too uniform (flat texture — printed/screen)
    #   - Texture variance is too low (over-smooth — screen/photo)
    #   - Specular reflection is too large (screen glare)
    lbp_flag  = lbp_score  > LBP_UNIFORMITY_THRESHOLD
    tex_flag  = tex_var    < TEXTURE_VARIANCE_THRESHOLD
    refl_flag = refl_score > REFLECTION_SCORE_THRESHOLD

    # Require at least 2 of 3 flags to avoid false positives from poor lighting
    flag_count = sum([lbp_flag, tex_flag, refl_flag])
    is_spoof = flag_count >= 2

    return is_spoof, {
        "lbp_uniformity":    round(lbp_score, 4),
        "texture_variance":  round(tex_var, 2),
        "reflection_score":  round(refl_score, 4),
        "lbp_flag":          lbp_flag,
        "texture_flag":      tex_flag,
        "reflection_flag":   refl_flag,
        "spoof_flags_count": flag_count,
    }


def check_liveness_from_frames(frames_b64):
    """
    Processes a sequence of base64-encoded frames for active liveness detection.

    Implements FOUR layered checks:
      1. Anti-spoofing (LBP texture + variance + reflection): blocks photo/screen attacks
      2. Blink detection: EAR drops below EAR_THRESHOLD for >= CONSECUTIVE_FRAMES
      3. Head movement: Nose tip displacement > MOVEMENT_THRESHOLD pixels
      4. Consistency: Anti-spoofing must pass on majority of frames

    ALL checks must pass for liveness_status = "Live".
    Returns a standardized JSON payload for the Node.js API gateway.
    """
    blink_detected    = False
    movement_detected = False
    nose_positions    = []
    consecutive_low   = 0

    spoof_frame_count = 0
    real_frame_count  = 0
    spoof_details_log = []

    base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    options = mp_vision.FaceLandmarkerOptions(
        base_options=base_options,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
        num_faces=1,
        min_face_detection_confidence=MIN_FACE_DETECT_CONF,
        min_face_presence_confidence=MIN_FACE_PRESENCE_CONF,
        min_tracking_confidence=MIN_TRACKING_CONF,
        running_mode=mp_vision.RunningMode.IMAGE,
    )

    with mp_vision.FaceLandmarker.create_from_options(options) as landmarker:
        for b64 in frames_b64:
            frame = decode_base64_image(b64)
            if frame is None:
                continue

            h, w = frame.shape[:2]
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

            result = landmarker.detect(mp_image)
            if not result.face_landmarks:
                continue

            landmarks = result.face_landmarks[0]

            # ── 1. ANTI-SPOOFING — texture analysis ──────────────────────────
            face_crop = crop_face_from_landmarks(frame, landmarks, w, h)
            is_spoof, spoof_info = is_frame_spoof(face_crop)
            if is_spoof:
                spoof_frame_count += 1
            else:
                real_frame_count += 1
            spoof_details_log.append(spoof_info)

            # ── 2. EAR blink detection ────────────────────────────────────────
            left_ear  = calculate_ear(landmarks, LEFT_EYE,  w, h)
            right_ear = calculate_ear(landmarks, RIGHT_EYE, w, h)
            avg_ear   = (left_ear + right_ear) / 2.0

            if avg_ear < EAR_THRESHOLD:
                consecutive_low += 1
            else:
                if consecutive_low >= CONSECUTIVE_FRAMES:
                    blink_detected = True
                consecutive_low = 0

            # ── 3. Nose tip tracking for head movement ────────────────────────
            nose = landmarks[4]
            nose_positions.append((nose.x * w, nose.y * h))

    # ── Final blink check ─────────────────────────────────────────────────────
    if consecutive_low >= CONSECUTIVE_FRAMES:
        blink_detected = True

    # ── Final movement check ──────────────────────────────────────────────────
    if len(nose_positions) > 5:
        xs = [p[0] for p in nose_positions]
        ys = [p[1] for p in nose_positions]
        if (max(xs) - min(xs)) > MOVEMENT_THRESHOLD or \
           (max(ys) - min(ys)) > MOVEMENT_THRESHOLD:
            movement_detected = True

    # ── 4. ANTI-SPOOFING VERDICT ──────────────────────────────────────────────
    # Require at least MIN_ANTI_SPOOF_FRAMES frames analyzed before deciding
    total_analyzed = real_frame_count + spoof_frame_count
    if total_analyzed < MIN_ANTI_SPOOF_FRAMES:
        # Not enough frames — conservative: fail
        anti_spoof_passed = False
        anti_spoof_reason = "insufficient_frames"
    else:
        # Spoof if more than 40% of analyzed frames flagged as spoof
        spoof_ratio = spoof_frame_count / total_analyzed
        anti_spoof_passed = spoof_ratio <= 0.40
        anti_spoof_reason = "passed" if anti_spoof_passed else f"spoof_ratio={round(spoof_ratio, 2)}"

    # ── FINAL DECISION ────────────────────────────────────────────────────────
    # ALL THREE conditions must pass — no exceptions, no fallbacks.
    #
    # Why blink is mandatory:
    #   A static photo or a phone screen showing a photo cannot perform a
    #   real blink. Removing this check allows photo attacks to pass when
    #   someone physically moves the phone (triggers movement_detected).
    #   The original IoT fallback has been REMOVED for this reason.
    #
    # Why movement is mandatory:
    #   Static images and printed photos cannot produce natural head movement.
    #
    # Why anti-spoof is mandatory:
    #   Blocks screen-based replay attacks before any biometric check.
    #
    # Minimum frame gate: MediaPipe must track landmarks in ≥ 30% of frames.
    # If fewer frames have landmarks, the person likely isn't in frame at all
    # (e.g. holding up a photo far from camera, or non-face content).
    total_frames = len(frames_b64)
    landmark_frames = real_frame_count + spoof_frame_count
    landmark_ratio = (landmark_frames / total_frames) if total_frames > 0 else 0
    sufficient_landmark_frames = landmark_ratio >= 0.30

    is_live = (anti_spoof_passed
               and blink_detected
               and movement_detected
               and sufficient_landmark_frames)
    iot_fallback_used = False  # IoT fallback permanently removed

    # Build a concise failure reason for debugging
    failure_reasons = []
    if not anti_spoof_passed:
        failure_reasons.append(f"anti_spoof_failed({anti_spoof_reason})")
    if not blink_detected:
        failure_reasons.append("no_blink")
    if not movement_detected:
        failure_reasons.append("no_head_movement")
    if not sufficient_landmark_frames:
        failure_reasons.append(f"insufficient_landmark_frames({landmark_ratio:.0%})")

    return {
        "status":                     "Live" if is_live else "Fake",
        "liveness_status":            "Live" if is_live else "Fake",
        "blink_detected":             blink_detected,
        "movement_detected":          movement_detected,
        "anti_spoof_passed":          anti_spoof_passed,
        "anti_spoof_reason":          anti_spoof_reason,
        "iot_fallback_used":          False,
        "spoof_frame_count":          spoof_frame_count,
        "real_frame_count":           real_frame_count,
        "landmark_frame_ratio":       round(landmark_ratio, 2),
        "sufficient_landmark_frames": sufficient_landmark_frames,
        "frames_processed":           len(frames_b64),
        "failure_reasons":            failure_reasons,
        "ear_threshold":              EAR_THRESHOLD,
        "window_seconds":             LIVENESS_WINDOW_SECONDS,
    }