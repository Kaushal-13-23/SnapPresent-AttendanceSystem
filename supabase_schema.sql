-- ============================================================================
-- SnapPresent Supabase SQL Schema
-- Copy and run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> Project -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Auth Users (Students)
CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    "userType" TEXT NOT NULL DEFAULT 'student',
    status TEXT NOT NULL DEFAULT 'active',
    created_at DOUBLE PRECISION DEFAULT EXTRACT(EPOCH FROM NOW()),
    raw_data JSONB DEFAULT '{}'::jsonb
);

-- 3. Auth Teachers (Faculty)
CREATE TABLE IF NOT EXISTS auth_teachers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    "userType" TEXT NOT NULL DEFAULT 'teacher',
    "employeeId" TEXT,
    department TEXT,
    role TEXT DEFAULT 'teacher',
    status TEXT NOT NULL DEFAULT 'active',
    created_at DOUBLE PRECISION DEFAULT EXTRACT(EPOCH FROM NOW()),
    raw_data JSONB DEFAULT '{}'::jsonb
);

-- 4. Students (Roster & Face Embeddings)
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL UNIQUE,
    "studentName" TEXT NOT NULL,
    department TEXT,
    year TEXT,
    division TEXT,
    semester TEXT,
    email TEXT NOT NULL UNIQUE,
    "phoneNumber" TEXT,
    status TEXT DEFAULT 'active',
    embeddings JSONB, -- stores 5-frame face embeddings arrays
    face_registered BOOLEAN DEFAULT TRUE,
    created_at DOUBLE PRECISION DEFAULT EXTRACT(EPOCH FROM NOW()),
    updated_at DOUBLE PRECISION DEFAULT EXTRACT(EPOCH FROM NOW()),
    raw_data JSONB DEFAULT '{}'::jsonb
);

-- 5. Attendance Records / Sessions
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    date TEXT,
    subject TEXT,
    department TEXT,
    year TEXT,
    division TEXT,
    finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    students JSONB DEFAULT '[]'::jsonb
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_teachers_email ON auth_teachers(email);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students("studentId");
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_dept_year ON students(department, year, division);
CREATE INDEX IF NOT EXISTS idx_attendance_records_lookup ON attendance_records(date, department, year, division, subject);

-- 7. Row Level Security Policies
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow access auth_users" ON auth_users;
CREATE POLICY "Allow access auth_users" ON auth_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow access auth_teachers" ON auth_teachers;
CREATE POLICY "Allow access auth_teachers" ON auth_teachers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow access students" ON students;
CREATE POLICY "Allow access students" ON students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow access attendance_records" ON attendance_records;
CREATE POLICY "Allow access attendance_records" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
