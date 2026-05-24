import cv2
import mediapipe as mp
import numpy as np
import base64

mp_face_mesh = mp.solutions.face_mesh

# MediaPipe eye landmark indices
LEFT_EYE = [263, 385, 386, 362, 374, 380]
RIGHT_EYE = [33, 159, 158, 133, 153, 145]

def calculate_ear(landmarks, eye_indices, image_w, image_h):
    """Calculate Eye Aspect Ratio to detect blink"""
    points = []
    for idx in eye_indices:
        lm = landmarks[idx]
        points.append((lm.x * image_w, lm.y * image_h))

    # EAR formula using 6 landmark points
    A = np.linalg.norm(np.array(points[1]) - np.array(points[5]))
    B = np.linalg.norm(np.array(points[2]) - np.array(points[4]))
    C = np.linalg.norm(np.array(points[0]) - np.array(points[3]))

    ear = (A + B) / (2.0 * C)
    return ear


def decode_base64_image(b64_string):
    """Convert base64 string to OpenCV image"""
    img_data = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img


def check_liveness_from_frames(frames_b64):
    """
    Input:  list of base64 encoded webcam frames
    Output: { status, blink_detected, movement_detected }
    """
    EAR_THRESHOLD = 0.25      # below this value = eye is closed
    MOVEMENT_THRESHOLD = 15   # pixels nose tip must move

    blink_detected = False
    movement_detected = False
    nose_positions = []
    prev_ear = None

    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5
    ) as face_mesh:

        for b64 in frames_b64:
            # Decode each frame
            frame = decode_base64_image(b64)
            if frame is None:
                continue

            h, w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            if not results.multi_face_landmarks:
                continue

            landmarks = results.multi_face_landmarks[0].landmark

            # --- Blink Detection ---
            left_ear = calculate_ear(landmarks, LEFT_EYE, w, h)
            right_ear = calculate_ear(landmarks, RIGHT_EYE, w, h)
            avg_ear = (left_ear + right_ear) / 2.0

            if prev_ear is not None:
                # Blink = EAR was open then dropped below threshold
                if prev_ear > EAR_THRESHOLD and avg_ear < EAR_THRESHOLD:
                    blink_detected = True

            prev_ear = avg_ear

            # --- Head Movement Detection (nose tip = landmark 4) ---
            nose = landmarks[4]
            nose_x = nose.x * w
            nose_y = nose.y * h
            nose_positions.append((nose_x, nose_y))

    # Check if nose moved enough across all frames
    if len(nose_positions) > 5:
        xs = [p[0] for p in nose_positions]
        ys = [p[1] for p in nose_positions]
        x_range = max(xs) - min(xs)
        y_range = max(ys) - min(ys)
        if x_range > MOVEMENT_THRESHOLD or y_range > MOVEMENT_THRESHOLD:
            movement_detected = True

    is_live = blink_detected and movement_detected

    return {
        "status": "Live" if is_live else "Fake",
        "blink_detected": blink_detected,
        "movement_detected": movement_detected
    }