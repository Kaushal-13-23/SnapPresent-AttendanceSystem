'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  RefreshCw,
  RotateCcw,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { WebcamCapture, WebcamCaptureHandle } from '@/components/WebcamCapture';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { api, StudentRegistrationPayload } from '@/lib/api';

interface FramePrompt {
  step: number;
  title: string;
  instruction: string;
  badge: string;
}

const FRAME_PROMPTS: FramePrompt[] = [
  {
    step: 1,
    title: 'Look Straight',
    instruction: 'Position your face in the center crosshair and look directly at the lens.',
    badge: 'Frontal Frame',
  },
  {
    step: 2,
    title: 'Turn Left',
    instruction: 'Gently turn your head ~20° to the left so your side profile is visible.',
    badge: 'Left Angle',
  },
  {
    step: 3,
    title: 'Turn Right',
    instruction: 'Gently turn your head ~20° to the right for right-angle features.',
    badge: 'Right Angle',
  },
  {
    step: 4,
    title: 'Chin Up',
    instruction: 'Tilt your chin slightly upwards (~15°) to capture lower jawline embeddings.',
    badge: 'Upward Angle',
  },
  {
    step: 5,
    title: 'Neutral Smile',
    instruction: 'Look straight with a natural, relaxed expression to seal your profile.',
    badge: 'Neutral Anchor',
  },
];

export default function RegisterFacePage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const { success, error, info } = useToast();
  const webcamRef = useRef<WebcamCaptureHandle | null>(null);

  // Form Fields
  const [studentName, setStudentName] = useState(user?.username || user?.studentName || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Engineering');
  const [year, setYear] = useState('TE');
  const [division, setDivision] = useState('A');
  const [semester, setSemester] = useState('5');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');

  // 5 Guided frames: array of base64 strings
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const activePrompt = FRAME_PROMPTS[Math.min(currentPromptIndex, 4)];
  const isAllFramesCaptured = capturedFrames.length === 5;

  // Handle single frame snap
  const handleSnapFrame = () => {
    if (!webcamRef.current) return;
    const base64 = webcamRef.current.captureFrame();
    if (!base64) {
      error('Unable to capture camera frame. Ensure camera is active.', 'Capture Failed');
      return;
    }

    const nextFrames = [...capturedFrames, base64];
    setCapturedFrames(nextFrames);

    if (nextFrames.length < 5) {
      setCurrentPromptIndex(nextFrames.length);
      info(`Captured frame ${nextFrames.length} of 5. Next: ${FRAME_PROMPTS[nextFrames.length].title}`, 'Frame Snapped');
    } else {
      success('All 5 angles captured! You can review or submit your registration.', '5 Frames Ready');
    }
  };

  // Retake / Undo specific frame
  const handleRetakeFrame = (indexToRetake: number) => {
    const updated = capturedFrames.filter((_, idx) => idx !== indexToRetake);
    setCapturedFrames(updated);
    setCurrentPromptIndex(indexToRetake);
    info(`Retaking frame ${indexToRetake + 1}.`, 'Retake Mode');
  };

  // Reset all captured frames
  const handleResetAll = () => {
    setCapturedFrames([]);
    setCurrentPromptIndex(0);
    info('Captured frames cleared. Start fresh from frame 1.', 'Reset');
  };

  // Submit complete enrollment to backend
  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (capturedFrames.length !== 5) {
      error('Exactly 5 webcam frames are required for face recognition.', 'Incomplete Frames');
      return;
    }

    if (!studentName || !studentId || !email || !phoneNumber) {
      error('Please complete all student information fields.', 'Missing Fields');
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      const payload: StudentRegistrationPayload = {
        studentName,
        studentId,
        department,
        year,
        division,
        semester,
        email,
        phoneNumber,
        images: capturedFrames,
      };

      await api.registerStudent(payload);
      success('Face biometric vector registered successfully!', 'Enrollment Complete');
      await refreshProfile();
      router.push('/dashboard/student');
    } catch (err: unknown) {
      const msg =
        (err as Error)?.message ||
        'Failed to register face. Make sure your face is clearly visible with good lighting.';
      setSubmissionError(msg);
      error(msg, 'Registration Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#8F76D9] uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Biometric Enrollment</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
          Register Your Face
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6C86] mt-1 font-body">
          Follow the 5-angle guided capture. Each snapshot extracts a 512-D vector embedding stored
          in MongoDB.
        </p>
      </div>

      {submissionError && (
        <div className="p-4 rounded-2xl bg-[#FFC8D6] border border-[#F2B3C3] text-[#8C2F4B] text-xs sm:text-sm font-medium flex items-start gap-2.5 shadow-soft-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Enrollment Could Not Be Processed</div>
            <div className="mt-0.5 leading-relaxed">{submissionError}</div>
          </div>
        </div>
      )}

      {/* Main Guided Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Camera & Prompter (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Prompt Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#F4EFFF] border border-[#E7E0F5] shadow-soft-sm flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#C9B6F2] text-[#2B2A3A] font-mono font-bold text-xs flex items-center justify-center">
                  {Math.min(capturedFrames.length + 1, 5)}
                </span>
                <span className="font-display font-black text-base text-[#2B2A3A]">
                  {isAllFramesCaptured ? 'All 5 Angles Captured!' : activePrompt.title}
                </span>
              </div>
              <p className="text-xs text-[#6E6C86] mt-1.5 leading-relaxed font-body">
                {isAllFramesCaptured
                  ? 'Great job! Review your polaroid snapshots below and submit your details.'
                  : activePrompt.instruction}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white text-[#8F76D9] border border-[#E7E0F5] shadow-xs">
                {capturedFrames.length} / 5 Snaps
              </span>
            </div>
          </div>

          {/* Webcam with Viewfinder Overlay */}
          <div className="space-y-4">
            <WebcamCapture
              ref={webcamRef}
              autoStart={true}
              title={isAllFramesCaptured ? 'Frames Complete' : activePrompt.badge}
              badge={`Frame ${Math.min(capturedFrames.length + 1, 5)} of 5`}
            />

            {/* Snap Controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetAll}
                disabled={capturedFrames.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#F4EFFF] border border-[#E7E0F5] text-xs font-medium text-[#6E6C86] disabled:opacity-40 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>

              <button
                type="button"
                onClick={handleSnapFrame}
                disabled={isAllFramesCaptured}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-sm shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-40"
              >
                <Camera className="w-4 h-4" />
                <span>
                  {isAllFramesCaptured
                    ? 'All 5 Frames Captured'
                    : `Snap Frame ${capturedFrames.length + 1}: ${activePrompt.title}`}
                </span>
              </button>
            </div>
          </div>

          {/* Captured Polaroid Thumbnails Row */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#2B2A3A]">
                Captured Polaroid Frames ({capturedFrames.length}/5)
              </h3>
              <span className="text-[11px] font-mono text-[#6E6C86]">
                Click thumbnail to retake
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {FRAME_PROMPTS.map((prompt, idx) => {
                const img = capturedFrames[idx];
                const isCaptured = !!img;
                const isCurrent = idx === capturedFrames.length;

                return (
                  <div
                    key={prompt.step}
                    onClick={() => isCaptured && handleRetakeFrame(idx)}
                    className={`relative rounded-2xl p-2 pb-3.5 border transition-all flex flex-col items-center justify-between text-center select-none ${
                      isCaptured
                        ? 'bg-white border-[#E7E0F5] shadow-xs cursor-pointer hover:shadow-soft hover:-translate-y-1'
                        : isCurrent
                        ? 'bg-[#F4EFFF] border-[#8F76D9] ring-2 ring-[#C9B6F2]/50'
                        : 'bg-[#FBF9FF] border-[#E7E0F5]/60 opacity-60'
                    }`}
                  >
                    {/* Inner Photo Frame */}
                    <div className="w-full aspect-square rounded-xl bg-[#F4EFFF] overflow-hidden flex items-center justify-center border border-[#E7E0F5]/80">
                      {isCaptured ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={`Angle ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-[#8F76D9] text-xs font-mono font-bold">
                          #{idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="mt-1.5 text-[10px] font-mono font-medium text-[#2B2A3A] truncate w-full">
                      {prompt.title}
                    </div>

                    {isCaptured && (
                      <span className="text-[9px] text-[#1F6B50] font-semibold flex items-center gap-0.5 mt-0.5">
                        &check; Snapped
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Student Details Form (5 Cols) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSubmitEnrollment}
            className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft space-y-4"
          >
            <div className="border-b border-[#E7E0F5] pb-4 mb-2">
              <h2 className="font-display font-black text-xl text-[#2B2A3A]">
                Student Identity Details
              </h2>
              <p className="text-xs text-[#6E6C86] mt-0.5">
                These records link your biometrics to the university roster.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full px-3.5 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9] focus-visible:ring-2 focus-visible:ring-[#8F76D9]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">
                  Student ID *
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="STU-2026-041"
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A] font-mono focus:bg-white focus:border-[#8F76D9] focus-visible:ring-2 focus-visible:ring-[#8F76D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A] font-mono focus:bg-white focus:border-[#8F76D9] focus-visible:ring-2 focus-visible:ring-[#8F76D9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">
                University Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@university.edu"
                className="w-full px-3.5 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9] focus-visible:ring-2 focus-visible:ring-[#8F76D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9] focus-visible:ring-2 focus-visible:ring-[#8F76D9]"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="AI & Data Science">AI & Data Science</option>
                <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A]"
                >
                  <option value="FE">FE (1st)</option>
                  <option value="SE">SE (2nd)</option>
                  <option value="TE">TE (3rd)</option>
                  <option value="BE">BE (4th)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Division</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A]"
                >
                  <option value="A">Div A</option>
                  <option value="B">Div B</option>
                  <option value="C">Div C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={String(s)}>
                      Sem {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={!isAllFramesCaptured || isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-sm shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Facenet Embeddings...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isAllFramesCaptured
                        ? 'Confirm & Save Biometric Face'
                        : `Capture ${5 - capturedFrames.length} More Frames`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {!isAllFramesCaptured && (
                <p className="text-[11px] text-[#6E6C86] text-center mt-2 font-mono">
                  &bull; Complete all 5 webcam frames to enable submission
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
