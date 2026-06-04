from flask import Flask, request, jsonify
from flask_cors import CORS
from face_match import match_faces
from liveness import check_liveness_from_frames

app = Flask(__name__)
CORS(app)  # Allow Node.js backend to call this service


# ── Health Check ──────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "AI service running"})


# ── Face Match Only ───────────────────────────────────
@app.route("/match-faces", methods=["POST"])
def face_match():
    data = request.json

    nic_image = data.get("nic_image")
    selfie_image = data.get("selfie_image")

    if not nic_image or not selfie_image:
        return jsonify({"error": "Both nic_image and selfie_image are required"}), 400

    result = match_faces(nic_image, selfie_image)
    return jsonify(result)


# ── Liveness Check Only ───────────────────────────────
@app.route("/check-liveness", methods=["POST"])
def liveness_check():
    data = request.json
    frames_b64 = data.get("frames")

    if not frames_b64 or len(frames_b64) == 0:
        return jsonify({"error": "No frames provided"}), 400

    result = check_liveness_from_frames(frames_b64)
    return jsonify(result)


# ── Full Verification Pipeline ────────────────────────
@app.route("/verify", methods=["POST"])
def full_verify():
    data = request.json

    user_id = data.get("user_id")
    nic_image = data.get("nic_image")
    selfie_image = data.get("selfie_image")
    frames_b64 = data.get("frames")

    # Validate inputs
    if not all([user_id, nic_image, selfie_image, frames_b64]):
        return jsonify({"error": "user_id, nic_image, selfie_image and frames are required"}), 400

    # Step 1 — Face Match
    face_result = match_faces(nic_image, selfie_image)

    # Step 2 — Liveness Detection
    liveness_result = check_liveness_from_frames(frames_b64)

    # Step 3 — Final decision
    # Both must pass for verified = True
    face_score     = face_result.get("face_score", 0)
    liveness_ok    = liveness_result.get("liveness_status", liveness_result.get("status")) == "Live"
    is_verified    = face_result.get("match") == True and liveness_ok

    return jsonify({
        "user_id":        user_id,
        "face_match":     face_result,
        "liveness":       liveness_result,
        "verified":       is_verified,
        # Top-level convenience fields for Node.js gateway
        "face_score":     face_score,
        "confidence":     face_score,
        "liveness_status": liveness_result.get("liveness_status", liveness_result.get("status", "Fake")),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5001)