import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://snappresent-backend.onrender.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = body?.session_id;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing session_id' },
        { status: 400 }
      );
    }

    // 1. Fetch current session record from Supabase
    const { data: sessionDoc, error: fetchErr } = await supabaseServer
      .from('attendance_records')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (fetchErr || !sessionDoc) {
      console.warn('Session not found in attendance_records, returning fallback stats');
      return NextResponse.json({
        success: true,
        statistics: {
          present_count: 0,
          absent_count: 0,
          total_students: 0,
        },
      });
    }

    const students = (sessionDoc.students as Array<{
      student_id: string;
      student_name: string;
      present: boolean;
      marked_at: string | null;
    }>) || [];

    const presentStudents = students.filter((s) => s.present);
    const absentCount = students.length - presentStudents.length;

    // 2. Mark session as finalized
    await supabaseServer
      .from('attendance_records')
      .update({
        finalized: true,
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    // 3. Insert individual attendance logs for reporting
    if (students.length > 0) {
      const attendanceRows = students.map((s) => ({
        id: crypto.randomUUID(),
        session_id: sessionId,
        studentId: s.student_id,
        studentName: s.student_name,
        date: sessionDoc.date || new Date().toISOString().split('T')[0],
        subject: sessionDoc.subject,
        department: sessionDoc.department,
        year: sessionDoc.year,
        division: sessionDoc.division,
        status: s.present ? 'present' : 'absent',
        markedAt: s.marked_at,
        created_at: Date.now() / 1000,
      }));

      await supabaseServer.from('attendance').insert(attendanceRows);
    }

    // 4. Notify Render backend in background (non-blocking)
    try {
      fetch(`${BACKEND_URL}/api/attendance/end_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      statistics: {
        present_count: presentStudents.length,
        absent_count: absentCount,
        total_students: students.length,
      },
    });
  } catch (err: unknown) {
    console.error('End session error:', err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || 'Failed to finalize session',
      },
      { status: 500 }
    );
  }
}
