import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://snappresent-backend.onrender.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const { date, subject, department, year, division } = body;

    if (!subject || !department) {
      return NextResponse.json(
        { success: false, error: 'Subject and department are required' },
        { status: 400 }
      );
    }

    // Generate a 24-char hex session ID compatible with both UUID and MongoDB ObjectId
    const sessionId = crypto.randomUUID().replace(/-/g, '').slice(0, 24);

    // 1. Fetch matching enrolled students from Supabase
    let studentQuery = supabaseServer
      .from('students')
      .select('studentId, studentName, department, year, division');

    if (department && department !== 'all') {
      studentQuery = studentQuery.eq('department', department);
    }
    if (year && year !== 'all') {
      studentQuery = studentQuery.eq('year', year);
    }
    if (division && division !== 'all') {
      studentQuery = studentQuery.eq('division', division);
    }

    const { data: matchedStudents, error: fetchErr } = await studentQuery;

    if (fetchErr) {
      console.error('Error fetching class roster students:', fetchErr);
    }

    const studentList = (matchedStudents || []).map((s) => ({
      student_id: s.studentId,
      student_name: s.studentName,
      present: false,
      marked_at: null,
    }));

    // 2. Insert session document into attendance_records table
    const sessionDoc = {
      id: sessionId,
      date: date || new Date().toISOString().split('T')[0],
      subject,
      department,
      year: year || '',
      division: division || '',
      finalized: false,
      created_at: new Date().toISOString(),
      ended_at: null,
      students: studentList,
    };

    const { error: insertErr } = await supabaseServer
      .from('attendance_records')
      .insert(sessionDoc);

    if (insertErr) {
      console.error('Supabase session insert error:', insertErr);
    }

    // 3. Inform Render backend asynchronously in the background if active (non-blocking)
    try {
      fetch(`${BACKEND_URL}/api/attendance/create_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, session_id: sessionId }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    } catch {
      // Non-blocking fallback
    }

    // 4. Return instant session response for frontend
    return NextResponse.json({
      success: true,
      session_id: sessionId,
      students_count: studentList.length,
    });
  } catch (err: unknown) {
    console.error('Create session error:', err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || 'Failed to initialize session',
      },
      { status: 500 }
    );
  }
}
