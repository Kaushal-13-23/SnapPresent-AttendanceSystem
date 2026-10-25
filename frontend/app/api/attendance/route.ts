import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const department = searchParams.get('department');
    const year = searchParams.get('year');
    const division = searchParams.get('division');
    const subject = searchParams.get('subject');
    const studentId = searchParams.get('student_id');

    // 1. Fetch roster students
    let rosterQuery = supabaseServer.from('students').select('*');
    if (department) rosterQuery = rosterQuery.eq('department', department);
    if (year) rosterQuery = rosterQuery.eq('year', year);
    if (division) rosterQuery = rosterQuery.eq('division', division);

    const { data: roster } = await rosterQuery;

    // 2. Fetch attendance session record if date/subject matches
    let attQuery = supabaseServer.from('attendance_records').select('*');
    if (date) attQuery = attQuery.eq('date', date);
    if (department) attQuery = attQuery.eq('department', department);
    if (year) attQuery = attQuery.eq('year', year);
    if (division) attQuery = attQuery.eq('division', division);
    if (subject) attQuery = attQuery.eq('subject', subject);

    const { data: sessions } = await attQuery.order('created_at', { ascending: false }).limit(1);
    const sessionDoc = sessions?.[0] || null;

    const sessionMap: Record<string, { status?: string; markedAt?: string }> = {};
    if (sessionDoc?.students && Array.isArray(sessionDoc.students)) {
      sessionDoc.students.forEach((s: { student_id?: string; studentId?: string; status?: string; markedAt?: string }) => {
        const sid = s.student_id || s.studentId;
        if (sid) {
          sessionMap[sid] = s;
        }
      });
    }

    const attendanceList: Array<{
      studentId: string;
      studentName: string;
      date: string;
      subject: string;
      department: string;
      year: string;
      division: string;
      status: 'present' | 'absent';
      markedAt: string | null;
    }> = [];

    let presentCount = 0;
    const seen = new Set<string>();

    (roster || []).forEach((st) => {
      const sid = st.studentId;
      if (!sid || seen.has(sid)) return;
      seen.add(sid);

      if (studentId && sid !== studentId) return;

      const isPresent = sessionMap[sid]?.status === 'present';
      if (isPresent) presentCount++;

      attendanceList.push({
        studentId: sid,
        studentName: st.studentName || 'Student',
        date: date || new Date().toISOString().split('T')[0],
        subject: subject || 'General Lecture',
        department: st.department || department || '',
        year: st.year || year || '',
        division: st.division || division || '',
        status: isPresent ? 'present' : 'absent',
        markedAt: sessionMap[sid]?.markedAt || null,
      });
    });

    const total = attendanceList.length;
    const absentCount = total - presentCount;
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      attendance: attendanceList,
      stats: {
        totalStudents: total,
        presentToday: presentCount,
        absentToday: absentCount,
        attendanceRate: rate,
      },
    });
  } catch (err: unknown) {
    console.error('Attendance fetch exception:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}
