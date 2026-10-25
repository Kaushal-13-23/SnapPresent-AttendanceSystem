import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data: students, error } = await supabaseServer
      .from('students')
      .select('department, year, face_registered, embeddings');

    if (error) {
      console.error('Error fetching students for stats:', error);
      return NextResponse.json(
        { success: false, error: 'Database query failed' },
        { status: 500 }
      );
    }

    const totalStudents = students?.length || 0;
    let faceRegistered = 0;
    const deptMap: Record<string, number> = {};
    const yearMap: Record<string, number> = {};

    students?.forEach((s) => {
      if (s.face_registered || (s.embeddings && Array.isArray(s.embeddings) && s.embeddings.length > 0)) {
        faceRegistered++;
      }
      const dept = s.department || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;

      const yr = s.year || 'Unknown';
      yearMap[yr] = (yearMap[yr] || 0) + 1;
    });

    const byDepartment = Object.entries(deptMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count);

    const byYear = Object.entries(yearMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => a._id.localeCompare(b._id));

    return NextResponse.json({
      success: true,
      stats: {
        total_students: totalStudents,
        face_registered: faceRegistered,
        by_department: byDepartment,
        by_year: byYear,
      },
    });
  } catch (err: unknown) {
    console.error('Stats exception:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to compute student stats' },
      { status: 500 }
    );
  }
}
