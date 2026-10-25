import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const userEmail = request.headers.get('X-User-Email');
    const userType = request.headers.get('X-User-Type') || 'student';

    let query = supabaseServer
      .from('students')
      .select('id, studentId, studentName, department, year, division, semester, email, phoneNumber, status, face_registered, created_at, updated_at');

    // If student, filter by their own email if available
    if (userType === 'student' && userEmail) {
      query = query.ilike('email', userEmail.trim().toLowerCase());
    }

    const { data: students, error } = await query.order('studentName', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch student records' },
        { status: 500 }
      );
    }

    const normalizedStudents = (students || []).map((s) => ({
      ...s,
      _id: s.id,
    }));

    return NextResponse.json({
      success: true,
      students: normalizedStudents,
      count: normalizedStudents.length,
    });
  } catch (err: unknown) {
    console.error('Students fetch exception:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected error fetching students' },
      { status: 500 }
    );
  }
}
