import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { username, email, password, userType = 'student', employeeId, department } = data;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isTeacher = userType === 'teacher';
    const tableName = isTeacher ? 'auth_teachers' : 'auth_users';

    if (isTeacher && !employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID required for teachers' },
        { status: 400 }
      );
    }

    // Check if email already registered in the specified role
    const { data: existingUser } = await supabaseServer
      .from(tableName)
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Email already registered as ${userType}` },
        { status: 400 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = crypto.randomUUID();
    const now = Date.now() / 1000;

    const userDoc: Record<string, unknown> = {
      id: userId,
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      userType: userType,
      status: 'active',
      created_at: now,
      raw_data: {},
    };

    if (isTeacher) {
      userDoc.employeeId = employeeId;
      userDoc.department = department || '';
      userDoc.role = 'teacher';
    }

    const { error: insertError } = await supabaseServer
      .from(tableName)
      .insert(userDoc);

    if (insertError) {
      console.error('Supabase user insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} registered successfully`,
    });
  } catch (err: unknown) {
    console.error('Sign up exception:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error occurred during registration' },
      { status: 500 }
    );
  }
}
