# app.py - OPTIMIZED VERSION
import os
import time
import logging
import threading
from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
import numpy as np

# Blueprint imports
from auth.routes import auth_bp

# Optional student/teacher blueprints
try:
    from student.registration import student_registration_bp
except ImportError:
    student_registration_bp = None

try:
    from student.updatedetails import student_update_bp
except ImportError:
    student_update_bp = None

try:
    from student.demo_session import demo_session_bp
except ImportError:
    demo_session_bp = None

try:
    from student.view_attendance import attendance_bp
except ImportError:
    attendance_bp = None

try:
    from teacher.attendance_records import attendance_session_bp
except ImportError:
    attendance_session_bp = None

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

# Database setup: Connects to Supabase if credentials are provided, falls back to MongoDB
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
DB_NAME = os.getenv("DATABASE_NAME", "facerecognition")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "students")
THRESHOLD = float(os.getenv("THRESHOLD", "0.6"))

if SUPABASE_URL and SUPABASE_KEY:
    logger.info(f"⚡ Connecting to Supabase at {SUPABASE_URL}...")
    from supabase_db import SupabaseDB
    db = SupabaseDB(SUPABASE_URL, SUPABASE_KEY)
    students_collection = db[COLLECTION_NAME]
    attendance_collection = db["attendance_records"]
    logger.info("✅ Connected to Supabase successfully")
else:
    logger.info("Connecting to MongoDB database...")
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    students_collection = db[COLLECTION_NAME]
    attendance_db = client["facerecognition_db"]
    attendance_collection = attendance_db["attendance_records"]
    logger.info("✅ Connected to MongoDB successfully")

# OPTIMIZED MODEL MANAGER CLASS (NON-BLOCKING BACKGROUND LOADING)
class ModelManager:
    """
    Singleton class to manage face recognition models
    Ensures models load asynchronously in a background thread so the server
    starts immediately (under 1 second) and never blocks web/auth requests.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        self.models_ready = False
        self.deepface_ready = False
        self.detector = None
        self._load_lock = threading.Lock()
        # Start background warm-up thread so web server starts immediately
        threading.Thread(target=self._background_warmup, daemon=True).start()

    def _background_warmup(self):
        """Warm up models in background without blocking server startup"""
        logger.info("🤖 Starting background model initialization...")
        try:
            self._ensure_detector()
            self._ensure_deepface()
            self.models_ready = True
            logger.info("🎉 Background model initialization completed successfully")
        except Exception as e:
            logger.warning(f"⚠️ Background model initialization deferred: {e}")

    def _ensure_detector(self):
        if self.detector is None:
            with self._load_lock:
                if self.detector is None:
                    from mtcnn import MTCNN
                    logger.info("Loading MTCNN detector...")
                    self.detector = MTCNN()
                    logger.info("✅ MTCNN detector loaded successfully")
        return self.detector

    def _ensure_deepface(self):
        if not self.deepface_ready:
            with self._load_lock:
                if not self.deepface_ready:
                    from deepface import DeepFace
                    logger.info("Warming up DeepFace Facenet512 model...")
                    dummy_img = np.zeros((160, 160, 3), dtype=np.uint8)
                    _ = DeepFace.represent(
                        dummy_img, 
                        model_name='Facenet512', 
                        detector_backend='skip',
                        enforce_detection=False
                    )
                    self.deepface_ready = True
                    self.models_ready = True
                    logger.info("✅ DeepFace Facenet512 model warmed up successfully")
        return self.deepface_ready

    def get_detector(self):
        """Get the MTCNN detector instance, loading on demand if needed"""
        return self._ensure_detector()

    def is_ready(self):
        """Check if all models are ready"""
        return self.models_ready or (self.detector is not None and self.deepface_ready)

    def health_check(self):
        """Perform model health check without crashing if still warming up"""
        try:
            return self.is_ready()
        except Exception as e:
            logger.error(f"Model health check failed: {e}")
            return False


class LazyMTCNN:
    """Proxy object so blueprints can call detect_faces on demand without blocking startup"""
    def __init__(self, manager: ModelManager):
        self._manager = manager

    def detect_faces(self, *args, **kwargs):
        detector = self._manager.get_detector()
        return detector.detect_faces(*args, **kwargs)

    def __getattr__(self, name):
        detector = self._manager.get_detector()
        return getattr(detector, name)


# Initialize the model manager (starts background thread)
logger.info("Initializing Model Manager (non-blocking)...")
model_manager = ModelManager()

# Flask app
app = Flask(__name__)
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
if FRONTEND_URL == "*":
    CORS(app, resources={r"/api/*": {"origins": "*"}})
else:
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    allowed_origins.extend([o.strip() for o in FRONTEND_URL.split(",") if o.strip()])
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Configure Flask app with database and model instances
app.config["DB"] = db
app.config["COLLECTION_NAME"] = COLLECTION_NAME
app.config["THRESHOLD"] = THRESHOLD
app.config["ATTENDANCE_COLLECTION"] = attendance_collection

# CRITICAL: Pass model manager and lazy detector to Flask config
app.config["MODEL_MANAGER"] = model_manager
app.config["MTCNN_DETECTOR"] = LazyMTCNN(model_manager)

bcrypt = Bcrypt(app)

# Health check endpoint
@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify server and model status"""
    model_status = model_manager.is_ready()
    return {
        "status": "healthy",
        "models_ready": model_status,
        "timestamp": time.time()
    }

# Register blueprints
app.register_blueprint(auth_bp)

if student_registration_bp:
    app.register_blueprint(student_registration_bp)
    logger.info("✅ Student registration blueprint registered")

if student_update_bp:
    app.register_blueprint(student_update_bp)
    logger.info("✅ Student update blueprint registered")

if demo_session_bp:
    app.register_blueprint(demo_session_bp)
    logger.info("✅ Demo session blueprint registered")

if attendance_bp:
    app.register_blueprint(attendance_bp)
    logger.info("✅ Attendance blueprint registered")

if attendance_session_bp:
    app.register_blueprint(attendance_session_bp)
    logger.info("✅ Attendance session blueprint registered")

# List all registered routes
logger.info("\nRegistered Flask Routes:")
for rule in app.url_map.iter_rules():
    logger.info(f"  {rule}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"🎯 Server starting on http://0.0.0.0:{port} (models warming in background)")
    app.run(host="0.0.0.0", port=port, debug=False)