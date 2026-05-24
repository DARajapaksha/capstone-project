from deepface import DeepFace
import base64
import numpy as np
import cv2
import os


def decode_base64_image(b64_string):
    """Convert base64 string to OpenCV image"""
    img_data = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img


def match_faces(nic_image_b64, selfie_image_b64):
    """
    Input:  two base64 encoded images (NIC photo and live selfie)
    Output: { match, face_score, distance, threshold }
    """
    try:
        # Decode both images
        nic_img = decode_base64_image(nic_image_b64)
        selfie_img = decode_base64_image(selfie_image_b64)

        # Save temporarily for DeepFace
        nic_path = "uploads/nic_temp.jpg"
        selfie_path = "uploads/selfie_temp.jpg"

        cv2.imwrite(nic_path, nic_img)
        cv2.imwrite(selfie_path, selfie_img)

        # Run DeepFace verification
        result = DeepFace.verify(
            img1_path=nic_path,
            img2_path=selfie_path,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=False
        )

        # Delete temp files after verification
        if os.path.exists(nic_path):
            os.remove(nic_path)
        if os.path.exists(selfie_path):
            os.remove(selfie_path)

        # Convert distance to similarity score (0 to 1)
        face_score = round(1 - result["distance"], 4)

        return {
            "match": result["verified"],
            "face_score": face_score,
            "distance": result["distance"],
            "threshold": result["threshold"]
        }

    except Exception as e:
        return {
            "match": False,
            "face_score": 0,
            "distance": 1,
            "threshold": 0,
            "error": str(e)
        }