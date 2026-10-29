from flask import Blueprint, request, jsonify, current_app
import time
import base64
import numpy as np
from PIL import Image
import io
from deepface import DeepFace
from mtcnn import MTCNN
from bson.objectid import ObjectId
import logging

student_registration_bp = Blueprint("student_registration", __name__)
logger = logging.getLogger(__name__)

def read_image_from_bytes(b):
    img = Image.open(io.BytesIO(b)).convert('RGB')
    return np.array(img)

def detect_faces_rgb(rgb_image, detector):
    faces = []
    try:
        detections = detector.detect_faces(rgb_image)
        for d in detections:
            if d.get('confidence', 0) > 0.70:
                x, y, w, h = d['box']
                x, y = max(0, x), max(0, y)
                if w > 30 and h > 30:
                    face_rgb = rgb_image[y:y+h, x:x+w]
                    faces.append({'box': (x, y, w, h), 'face': face_rgb, 'confidence': d['confidence']})
    except Exception as e:
        logger.warning(f"Face detector warning: {e}")

    # Fallback if detector missed angled face (e.g., slight left/right/up): center crop
    if not faces and rgb_image.shape[0] >= 80 and rgb_image.shape[1] >= 80:
        h, w, _ = rgb_image.shape
        cy, cx = h // 2, w // 2
        crop_size = int(min(h, w) * 0.75)
        y1, y2 = max(0, cy - crop_size // 2), min(h, cy + crop_size // 2)
        x1, x2 = max(0, cx - crop_size // 2), min(w, cx + crop_size // 2)
        crop = rgb_image[y1:y2, x1:x2]
        faces.append({'box': (x1, y1, x2 - x1, y2 - y1), 'face': crop, 'confidence': 0.80})

    return faces

def extract_embedding(face_rgb):
    try:
        face_pil = Image.fromarray(face_rgb.astype('uint8')).resize((160, 160))
        face_array = np.array(face_pil)
        rep = DeepFace.represent(
            face_array,
            model_name='Facenet512',
            detector_backend='skip',
            enforce_detection=False
        )
        if rep and len(rep) > 0 and 'embedding' in rep[0]:
            return np.array(rep[0]['embedding'], dtype=float)
        return None
    except Exception as e:
        logger.error(f"Embedding extraction error: {e}")
        return None

@student_registration_bp.route('/api/register-student', methods=['POST'])
def register_student():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON data"}), 400

    db = current_app.config.get("DB")
    students_col = db.students

    # Check required fields
    required_fields = ['studentName', 'studentId', 'department', 'year', 'division', 'semester', 'email', 'phoneNumber', 'images']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "error": f"{field} is required"}), 400

    clean_student_id = str(data['studentId']).strip()
    clean_email = str(data['email']).strip().lower()

    # Allow re-registration / updating biometric face for the same student
    existing_by_id = students_col.find_one({'studentId': clean_student_id})
    existing_by_email = students_col.find_one({'email': clean_email})

    if existing_by_email and existing_by_id:
        id_1 = str(existing_by_email.get('id') or existing_by_email.get('_id'))
        id_2 = str(existing_by_id.get('id') or existing_by_id.get('_id'))
        if id_1 != id_2:
            return jsonify({"success": False, "error": "Email is already registered under a different student ID"}), 400

    existing_student = existing_by_id or existing_by_email

    # Validate images
    images = data.get('images')
    if not isinstance(images, list) or len(images) != 5:
        return jsonify({"success": False, "error": "Exactly 5 images are required"}), 400

    embeddings = []
    detector = current_app.config.get('MTCNN_DETECTOR')

    for idx, img_b64 in enumerate(images):
        try:
            if img_b64.startswith("data:"):
                img_b64 = img_b64.split(",", 1)[1]
            rgb = read_image_from_bytes(base64.b64decode(img_b64))
        except Exception:
            return jsonify({"success": False, "error": f"Invalid image data at index {idx}"}), 400

        faces = detect_faces_rgb(rgb, detector)
        if len(faces) == 0:
            return jsonify({"success": False, "error": f"No face detected in angle frame {idx+1}. Please face the camera clearly."}), 400

        emb = extract_embedding(faces[0]['face'])
        if emb is None:
            return jsonify({"success": False, "error": f"Failed to extract face features for frame {idx+1}"}), 500
        embeddings.append(emb.tolist())

    now = time.time()
    student_data = {
        "studentId": clean_student_id,
        "studentName": data['studentName'].strip(),
        "department": data['department'].strip(),
        "year": data['year'].strip(),
        "division": data['division'].strip(),
        "semester": data['semester'].strip(),
        "email": clean_email,
        "phoneNumber": str(data['phoneNumber']).strip(),
        "status": "active",
        "embeddings": embeddings,
        "face_registered": True,
        "updated_at": now
    }

    if existing_student:
        target_id = str(existing_student.get('id') or existing_student.get('_id'))
        students_col.update_one({'id': target_id}, {'$set': student_data})
        record_id = target_id
        logger.info(f"✅ Updated biometric face embeddings for student {clean_student_id} ({record_id})")
    else:
        student_data["created_at"] = now
        result = students_col.insert_one(student_data)
        record_id = str(result.inserted_id)
        logger.info(f"✅ Enrolled new student {clean_student_id} with {len(embeddings)} face embeddings ({record_id})")

    return jsonify({"success": True, "studentId": clean_student_id, "record_id": record_id})

@student_registration_bp.route('/api/students/count', methods=['GET'])
def get_student_count():
    db = current_app.config.get("DB")
    return jsonify({"success": True, "count": db.students.count_documents({})})

@student_registration_bp.route('/api/students/departments', methods=['GET'])
def get_departments():
    db = current_app.config.get("DB")
    departments = db.students.distinct("department")
    return jsonify({"success": True, "departments": departments, "count": len(departments)})
