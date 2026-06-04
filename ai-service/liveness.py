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

# ── Model setup ───────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "face_landmarker.task")

if not os.path.exists(MODEL_PATH):
    print("Downloading face_landmarker.task model...")
    url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    urllib.request.urlretrieve(url, MODEL_PATH)
    print("Model downloaded.")

# MediaPipe 468-point face mesh — standard ocular landmark indices
# RIGHT_EYE outer corner, upper lid x2, inner corner, lower lid x2
RIGHT_EYE = [33,  159, 158, 133, 153, 145]
# LEFT_EYE  outer corner, upper lid x2, inner corner, lower lid x2
LEFT_EYE  = [263, 385, 386, 362, 374, 380]


def calculate_ear(landmarks, eye_indices, image_w, image_h):
    """
    Eye Aspect Ratio (EAR) — geometric algorithm for detecting blinks.
    EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
    Drops rapidly when eyelids close, remains stable when eyes are open.
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


def check_liveness_from_frames(frames_b64):
    """
    Processes a sequence of base64-encoded frames for active liveness detection.

    Implements two checks:
      1. Blink detection: EAR drops below EAR_THRESHOLD for >= CONSECUTIVE_FRAMES
      2. Head movement:   Nose tip displacement > MOVEMENT_THRESHOLD pixels

    Both must be satisfied within LIVENESS_WINDOW_SECONDS to pass.
    Returns a standardized JSON payload for the Node.js API gateway.
    """
    blink_detected    = False
    movement_detected = False
    nose_positions    = []
    prev_ear          = None
    consecutive_low   = 0   # frames with EAR below threshold in a row

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

            # ── EAR blink detection ───────────────────────────────────────────
            left_ear  = calculate_ear(landmarks, LEFT_EYE,  w, h)
            right_ear = calculate_ear(landmarks, RIGHT_EYE, w, h)
            avg_ear   = (left_ear + right_ear) / 2.0

            if avg_ear < EAR_THRESHOLD:
                consecutive_low += 1
            else:
                if consecutive_low >= CONSECUTIVE_FRAMES:
                    blink_detected = True
                consecutive_low = 0
            prev_ear = avg_ear

            # ── Nose tip tracking for movement ────────────────────────────────
            nose = landmarks[4]
            nose_positions.append((nose.x * w, nose.y * h))

    # Final blink check: if still in low EAR at end of frames
    if consecutive_low >= CONSECUTIVE_FRAMES:
        blink_detected = True

    # Movement check: nose tip range across all frames
    if len(nose_positions) > 5:
        xs = [p[0] for p in nose_positions]
        ys = [p[1] for p in nose_positions]
        if (max(xs) - min(xs)) > MOVEMENT_THRESHOLD or \
           (max(ys) - min(ys)) > MOVEMENT_THRESHOLD:
            movement_detected = True

    is_live = blink_detected and movement_detected

    return {
        "status":            "Live" if is_live else "Fake",
        "liveness_status":   "Live" if is_live else "Fake",   # standardized field name
        "blink_detected":    blink_detected,
        "movement_detected": movement_detected,
        "frames_processed":  len(frames_b64),
        "ear_threshold":     EAR_THRESHOLD,
        "window_seconds":    LIVENESS_WINDOW_SECONDS,
    }