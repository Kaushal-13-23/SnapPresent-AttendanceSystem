---
title: SnapPresent AI Backend
emoji: 📸
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# SnapPresent - Biometric Facial Attendance Backend

Flask + DeepFace (Facenet512) + MTCNN AI microservice for SnapPresent real-time attendance system.
Backed by Supabase PostgreSQL.

## Environment Variables
Set the following in **Space Settings -> Variables and secrets**:

- `SUPABASE_URL`: Your Supabase Project URL (`https://zyxquwpfoqgzksnflxyj.supabase.co`)
- `SUPABASE_KEY`: Your Supabase API Key
- `FLASK_ENV`: `production`
- `FRONTEND_URL`: `*` (or your Vercel URL `https://snappresent-attendancesystem.vercel.app`)
- `THRESHOLD`: `0.65`
