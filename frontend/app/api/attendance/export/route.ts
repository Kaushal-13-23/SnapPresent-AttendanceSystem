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

    let query = supabaseServer.from('attendance').select('*').order('date', { ascending: false });

    if (date) query = query.eq('date', date);
    if (department && department !== 'all') query = query.eq('department', department);
    if (year && year !== 'all') query = query.eq('year', year);
    if (division && division !== 'all') query = query.eq('division', division);
    if (subject && subject !== 'all') query = query.eq('subject', subject);

    const { data: records, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: records || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Export error' },
      { status: 500 }
    );
  }
}
