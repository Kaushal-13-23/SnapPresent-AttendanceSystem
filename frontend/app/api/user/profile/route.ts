import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const userEmail = request.headers.get('X-User-Email');
    const userType = request.headers.get('X-User-Type') || 'student';

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    const isTeacher = userType === 'teacher';
    const tableName = isTeacher ? 'auth_teachers' : 'auth_users';

    const { data: user, error } = await supabaseServer
      .from(tableName)
      .select('id, username, email, userType, status, created_at, employeeId, department, role')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Attach student profile if available
    const { data: studentRecord } = await supabaseServer
      .from('students')
      .select('*')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    const userInfo: Record<string, unknown> = {
      _id: user.id,
      id: user.id,
      username: user.username,
      email: user.email,
      userType: userType,
      role: user.role || userType,
      employeeId: user.employeeId,
      department: user.department,
    };

    if (studentRecord) {
      userInfo.hasStudentRecord = true;
      userInfo.studentId = studentRecord.studentId;
      userInfo.studentName = studentRecord.studentName;
      if (!userInfo.department) {
        userInfo.department = studentRecord.department;
      }
    }

    return NextResponse.json({
      success: true,
      user: userInfo,
    });
  } catch (err: unknown) {
    console.error('Profile fetch exception:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
