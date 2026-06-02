import cv2
import numpy as np
import base64

LEFT_EYE = [263, 385, 386, 362, 374, 380]
RIGHT_EYE = [33, 159, 158, 133, 153, 145]

def calculate_ear(landmarks, eye_indices, image_w, image_h):
    points = []
    for idx in eye_indices:
        lm = landmarks[idx]
        points.append((lm.x * image_w, lm.y * image_h))
    A = np.linalg.norm(np.array(points[1]) - np.array(points[5]))
    B = np.linalg.norm(np.array(points[2]) - np.array(points[4]))
    C = np.linalg.norm(np.array(points[0]) - np.array(points[3]))
    return (A + B) / (2.0 * C)

def decode_base64_image(b64_string):
    # Strip data URL prefix if present
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    
    img_data = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

def check_liveness_from_frames(frames_b64):
    import mediapipe as mp

    EAR_THRESHOLD = 0.25
    MOVEMENT_THRESHOLD = 15
    blink_detected = False
    movement_detected = False
    nose_positions = []
    prev_ear = None

    with mp.solutions.face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5
    ) as face_mesh:

        for b64 in frames_b64:
            frame = decode_base64_image(b64)
            if frame is None:
                continue

            h, w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            if not results.multi_face_landmarks:
                continue

            landmarks = results.multi_face_landmarks[0].landmark

            left_ear = calculate_ear(landmarks, LEFT_EYE, w, h)
            right_ear = calculate_ear(landmarks, RIGHT_EYE, w, h)
            avg_ear = (left_ear + right_ear) / 2.0

            if prev_ear is not None:
                if prev_ear > EAR_THRESHOLD and avg_ear < EAR_THRESHOLD:
                    blink_detected = True
            prev_ear = avg_ear

            nose = landmarks[4]
            nose_positions.append((nose.x * w, nose.y * h))

    if len(nose_positions) > 5:
        xs = [p[0] for p in nose_positions]
        ys = [p[1] for p in nose_positions]
        if (max(xs) - min(xs)) > MOVEMENT_THRESHOLD or \
           (max(ys) - min(ys)) > MOVEMENT_THRESHOLD:
            movement_detected = True

    return {
        "status": "Live" if (blink_detected and movement_detected) else "Fake",
        "blink_detected": blink_detected,
        "movement_detected": movement_detected
    }