import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const {
      studentName,
      studentId,
      department,
      year,
      division,
      semester,
      email,
      phoneNumber,
      images,
    } = data;

    // 1. Validate required fields
    if (
      !studentName ||
      !studentId ||
      !department ||
      !year ||
      !division ||
      !semester ||
      !email ||
      !phoneNumber
    ) {
      return NextResponse.json(
        { success: false, error: 'All student details are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(images) || images.length !== 5) {
      return NextResponse.json(
        { success: false, error: 'Exactly 5 face photos are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanStudentId = studentId.trim();

    // 2. Check uniqueness in students table
    const { data: existingStudent } = await supabaseServer
      .from('students')
      .select('id, studentId, email')
      .or(`studentId.eq.${cleanStudentId},email.ilike.${normalizedEmail}`)
      .maybeSingle();

    const recordId = existingStudent?.id || crypto.randomUUID();

    // 3. Forward to Render AI backend to run MTCNN face detection and DeepFace Facenet512 feature extraction
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://snappresent-backend.onrender.com';

    let renderRes: Response;
    try {
      renderRes = await fetch(`${backendUrl}/api/register-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(60000), // 60s timeout for neural network feature extraction across 5 frames
      });
    } catch (fetchErr: unknown) {
      console.error('Render AI backend fetch error:', fetchErr);
      return NextResponse.json(
        {
          success: false,
          error:
            'The AI recognition server is currently waking up from idle (~20-30s). Please wait a moment and click "Confirm & Save Biometric Face" again.',
        },
        { status: 503 }
      );
    }

    const text = await renderRes.text();
    let renderData;
    try {
      renderData = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            'AI recognition engine is still initializing. Please wait 15 seconds and try again.',
        },
        { status: 503 }
      );
    }

    if (!renderRes.ok || !renderData?.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            renderData?.error ||
            'Failed to extract face features. Please ensure your face is clearly visible in all 5 angles with good lighting.',
        },
        { status: renderRes.status || 400 }
      );
    }

    // Success from Render AI! The student record with REAL 512-D neural embeddings
    // has already been saved to the database by the backend.
    return NextResponse.json({
      success: true,
      studentId: cleanStudentId,
      record_id: renderData.record_id || recordId,
      message: 'Biometric face registration complete via AI model',
    });
  } catch (err: unknown) {
    console.error('Student registration error:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected error during student registration' },
      { status: 500 }
    );
  }
}
