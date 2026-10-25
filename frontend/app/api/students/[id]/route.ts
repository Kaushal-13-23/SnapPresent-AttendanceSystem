import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
    }

    const { data: student, error } = await supabaseServer
      .from('students')
      .select('*')
      .or(`id.eq.${id},studentId.eq.${id}`)
      .maybeSingle();

    if (error || !student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, student });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: updated, error } = await supabaseServer
      .from('students')
      .update({ ...body, updated_at: Date.now() / 1000 })
      .or(`id.eq.${id},studentId.eq.${id}`)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Student updated successfully', student: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseServer
      .from('students')
      .delete()
      .or(`id.eq.${id},studentId.eq.${id}`);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Student removed successfully' });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
