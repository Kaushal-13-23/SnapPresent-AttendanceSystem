import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://snappresent-backend.onrender.com'
).replace(/\/+$/, '');

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
        signal: AbortSignal.timeout(20000), // 20s timeout for AI inference
      });
    } catch (fetchErr) {
      console.warn('AI backend fetch error during real-mark:', fetchErr);
      return NextResponse.json({
        message: 'AI backend connecting / warming up, scan continues...',
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
      console.warn('AI backend returned non-JSON response during real-mark:', text.slice(0, 100));
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
        (f: { status?: string; match?: { user_id?: string; name?: string } }) =>
          (f.status === 'marked_present' || f.status === 'marked_present_new') && f.match?.user_id
      );

      if (newlyMarked.length > 0) {
        try {
          const { data: sessionDoc } = await supabaseServer
            .from('attendance_records')
            .select('students')
            .eq('id', sessionId)
            .maybeSingle();

          if (sessionDoc) {
            const rawStudents = Array.isArray(sessionDoc.students) ? sessionDoc.students : [];
            const markedMap = new Map<string, string>();
            for (const f of newlyMarked) {
              if (f.match?.user_id) {
                markedMap.set(String(f.match.user_id), String(f.match.name || 'Student'));
              }
            }
            const existingIds = new Set<string>();

            const updatedStudents = rawStudents.map((st: { student_id: string; present: boolean; marked_at: string | null; student_name?: string }) => {
              existingIds.add(String(st.student_id));
              if (markedMap.has(String(st.student_id))) {
                return { ...st, present: true, marked_at: new Date().toLocaleTimeString() };
              }
              return st;
            });

            // Append any student that was not initially preloaded in the class list
            for (const [mid, mname] of markedMap.entries()) {
              if (!existingIds.has(mid)) {
                updatedStudents.push({
                  student_id: mid,
                  student_name: mname,
                  present: true,
                  marked_at: new Date().toLocaleTimeString(),
                });
              }
            }

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
