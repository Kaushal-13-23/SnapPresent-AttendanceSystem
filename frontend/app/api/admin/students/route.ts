import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const year = searchParams.get('year');
    const division = searchParams.get('division');

    let query = supabaseServer
      .from('students')
      .select('id, studentId, studentName, department, year, division, semester, email, phoneNumber, status, face_registered, created_at, updated_at');

    if (department) {
      query = query.eq('department', department);
    }
    if (year) {
      query = query.eq('year', year);
    }
    if (division) {
      query = query.eq('division', division);
    }
    if (search) {
      query = query.or(`studentName.ilike.%${search}%,studentId.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: students, error } = await query.order('studentName', { ascending: true });

    if (error) {
      console.error('Error fetching admin students:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students roster' },
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
    console.error('Admin students exception:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected error fetching students' },
      { status: 500 }
    );
  }
}
