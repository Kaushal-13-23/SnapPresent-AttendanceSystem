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

    let res: Response;
    try {
      res = await fetch(`${BACKEND_URL}/api/attendance/real-mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000), // 12s timeout for AI inference
      });
    } catch (fetchErr) {
      console.warn('Render AI backend fetch error during real-mark:', fetchErr);
      return NextResponse.json({
        message: 'AI backend warming up, scan continues...',
        faces: [],
        session_info: {
          session_id: sessionId,
          total_present_now: 0,
          faces_detected: 0,
          duplicates_prevented: 0,
        },
      });
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Returned HTML error page (e.g., 502/503 during cold boot)
      console.warn('Render returned non-JSON response during real-mark:', text.slice(0, 100));
      return NextResponse.json({
        message: 'AI model initializing, scanning in progress...',
        faces: [],
        session_info: {
          session_id: sessionId,
          total_present_now: 0,
          faces_detected: 0,
          duplicates_prevented: 0,
        },
      });
    }

    // If matches occurred and we have session_id, sync present student to Supabase
    if (sessionId && Array.isArray(data?.faces) && data.faces.length > 0) {
      const newlyMarked = data.faces.filter(
        (f: { status?: string; match?: { user_id?: string } }) =>
          (f.status === 'marked_present' || f.status === 'marked_present_new') && f.match?.user_id
      );

      if (newlyMarked.length > 0) {
        try {
          const { data: sessionDoc } = await supabaseServer
            .from('attendance_records')
            .select('students')
            .eq('id', sessionId)
            .maybeSingle();

          if (sessionDoc && Array.isArray(sessionDoc.students)) {
            const markedIds = new Set(newlyMarked.map((f: { match: { user_id: string } }) => f.match.user_id));
            const updatedStudents = sessionDoc.students.map((st: { student_id: string; present: boolean; marked_at: string | null }) => {
              if (markedIds.has(st.student_id)) {
                return { ...st, present: true, marked_at: new Date().toLocaleTimeString() };
              }
              return st;
            });

            await supabaseServer
              .from('attendance_records')
              .update({ students: updatedStudents })
              .eq('id', sessionId);
          }
        } catch (syncErr) {
          console.error('Error syncing marked faces to Supabase:', syncErr);
        }
      }
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error('Real-mark route error:', err);
    return NextResponse.json(
      {
        message: 'Frame scan error, continuing loop...',
        faces: [],
      },
      { status: 200 }
    );
  }
}
