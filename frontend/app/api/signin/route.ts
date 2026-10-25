import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, password, userType = 'student' } = data;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isTeacher = userType === 'teacher';
    const tableName = isTeacher ? 'auth_teachers' : 'auth_users';

    // 1. Fetch user by email from Supabase
    const { data: user, error: fetchError } = await supabaseServer
      .from(tableName)
      .select('*')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase query error during signin:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Database service unavailable. Please try again.' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: `No ${userType} account found with this email` },
        { status: 401 }
      );
    }

    // 2. Check if account is active
    if (user.status === 'inactive') {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated. Contact administrator.' },
        { status: 401 }
      );
    }

    // 3. Verify bcrypt password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // 4. Base user info
    const userInfo: Record<string, unknown> = {
      _id: user.id,
      id: user.id,
      username: user.username,
      email: user.email,
      userType: userType,
      role: user.role || (isTeacher ? 'teacher' : 'student'),
    };

    // 5. Look up student profile in students table if applicable
    const { data: studentRecord } = await supabaseServer
      .from('students')
      .select('*')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (isTeacher) {
      userInfo.employeeId = user.employeeId || user.employee_id;
      userInfo.department = user.department;
      userInfo.name = user.username;
      if (studentRecord) {
        userInfo.hasStudentRecord = true;
        userInfo.studentId = studentRecord.studentId;
      }
    } else {
      if (studentRecord) {
        userInfo.studentId = studentRecord.studentId;
        userInfo.studentName = studentRecord.studentName;
        userInfo.department = studentRecord.department;
        userInfo.year = studentRecord.year;
        userInfo.division = studentRecord.division;
        userInfo.hasStudentRecord = true;
      } else {
        userInfo.hasStudentRecord = false;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      userType: userType,
      user: userInfo,
    });
  } catch (err: unknown) {
    console.error('Sign in exception:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error occurred during login' },
      { status: 500 }
    );
  }
}
