'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Play,
  Pause,
  StopCircle,
  Users,
  CheckCircle2,
  Camera,
  Calendar,
  Building,
  GraduationCap,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import { WebcamCapture, WebcamCaptureHandle } from '@/components/WebcamCapture';
import { StatusStamp } from '@/components/StatusStamp';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import {
  api,
  CreateSessionPayload,
  EndSessionResponse,
} from '@/lib/api';

interface RecognizedEvent {
  id: string;
  studentId: string;
  name: string;
  confidence: number;
  timestamp: string;
  alreadyMarked: boolean;
  status: 'marked_present' | 'marked_present_new' | 'duplicate';
  thumbnail?: string;
}

export default function FacultyLiveSessionPage() {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const webcamRef = useRef<WebcamCaptureHandle | null>(null);

  // Setup Form State
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [studentsPreloaded, setStudentsPreloaded] = useState<number>(0);

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState<string>('Computer Networks');
  const [department, setDepartment] = useState<string>(user?.department || 'Computer Engineering');
  const [year, setYear] = useState<string>('TE');
  const [division, setDivision] = useState<string>('A');

  // Live Session Controls & Metrics
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [totalPresentNow, setTotalPresentNow] = useState<number>(0);
  const [duplicatesPrevented, setDuplicatesPrevented] = useState<number>(0);
  const [matchedFeed, setMatchedFeed] = useState<RecognizedEvent[]>([]);
  const [shutterTrigger, setShutterTrigger] = useState<boolean>(false);

  // Final Summary Modal
  const [isEndingSession, setIsEndingSession] = useState<boolean>(false);
  const [finalSummary, setFinalSummary] = useState<EndSessionResponse['statistics'] | null>(null);

  // Trigger temporary shutter flash overlay
  const triggerShutterFlash = useCallback(() => {
    setShutterTrigger(true);
    setTimeout(() => setShutterTrigger(false), 380);
  }, []);

  // Live Scanner Feedback State
  const [scannerStatus, setScannerStatus] = useState<{
    text: string;
    type: 'idle' | 'scanning' | 'matched' | 'unrecognized' | 'warming';
  }>({ text: 'Scanner active. Align face in viewfinder.', type: 'scanning' });

  // Rate-limit alerts so they don't spam every 2 seconds
  const lastAlertTimeRef = useRef<{ [key: string]: number }>({});

  // Audio chime feedback for marked attendance
  const playAttendanceChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay might be restricted before interaction
    }
  }, []);

  // Step 1: Initialize session on backend
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !department) {
      error('Please specify both subject and department', 'Setup Error');
      return;
    }

    try {
      const payload: CreateSessionPayload = {
        date,
        subject,
        department,
        year,
        division,
      };

      const res = await api.createSession(payload);
      setSessionId(res.session_id);
      setStudentsPreloaded(res.students_count);
      setSessionActive(true);
      setMatchedFeed([]);
      setTotalPresentNow(0);
      setDuplicatesPrevented(0);
      setIsPaused(false);
      setScannerStatus({ text: 'Session active. Ready for student faces.', type: 'scanning' });

      success(
        `Session initiated for ${subject} (${department} - ${year} Div ${division}). Preloaded ${res.students_count} roster students.`,
        'Session Active'
      );

      // Start live sampling
      startScanning(res.session_id);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to start live session';
      error(msg, 'Session Error');
    }
  };

  // Start live webcam sampling loop (~2s interval with frame drop)
  const startScanning = useCallback(
    (currentSessionId: string) => {
      if (!webcamRef.current) return;

      webcamRef.current.startLiveSampling(async (base64Frame: string) => {
        if (isPaused) return;

        try {
          const res = await api.realMarkAttendance(currentSessionId, base64Frame);
          const now = Date.now();

          // Check if AI backend reported warming up
          if (res?.message && (res.message.toLowerCase().includes('warming') || res.message.toLowerCase().includes('initializing'))) {
            setScannerStatus({
              text: 'AI engine connecting / warming up... Please hold steady in frame.',
              type: 'warming',
            });
            if (now - (lastAlertTimeRef.current['warming'] || 0) > 15000) {
              info('AI models are warming up on backend. Hold steady.', 'AI Initializing');
              lastAlertTimeRef.current['warming'] = now;
            }
            return;
          }

          if (res?.session_info) {
            setTotalPresentNow(res.session_info.total_present_now);
            if (res.session_info.duplicates_prevented) {
              setDuplicatesPrevented(
                (prev) => prev + (res.session_info?.duplicates_prevented || 0)
              );
            }
          }

          // Case 1: No faces detected in frame
          if (!res?.faces || res.faces.length === 0) {
            setScannerStatus({
              text: 'Looking for faces... Please face the camera with good lighting.',
              type: 'scanning',
            });
            return;
          }

          // Case 2: Faces detected
          let anyMatchedInThisFrame = false;

          res.faces.forEach((face) => {
            if (face.match) {
              anyMatchedInThisFrame = true;
              const nowTime = new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              const isDuplicate = !!face.already_marked || face.status === 'duplicate';

              const eventItem: RecognizedEvent = {
                id: `${face.match.user_id}-${Date.now()}-${Math.random()}`,
                studentId: face.match.user_id,
                name: face.match.name,
                confidence: face.confidence ?? 95.0,
                timestamp: nowTime,
                alreadyMarked: isDuplicate,
                status: (face.status as RecognizedEvent['status']) || 'marked_present',
                thumbnail: base64Frame,
              };

              // Trigger shutter flash & chime
              triggerShutterFlash();
              if (!isDuplicate) {
                playAttendanceChime();
              }

              // Update HUD Status Banner
              setScannerStatus({
                text: isDuplicate
                  ? `ℹ️ Already Marked: ${face.match.name} (${face.match.user_id})`
                  : `✅ Verified: ${face.match.name} (${face.match.user_id}) - ${face.confidence?.toFixed(1) ?? '95'}% match`,
                type: 'matched',
              });

              // Trigger Alert Toast
              const lastStudentAlert = lastAlertTimeRef.current[face.match.user_id] || 0;
              if (now - lastStudentAlert > 8000) {
                if (isDuplicate) {
                  info(`${face.match.name} is already marked present in this session.`, 'Already Present');
                } else {
                  success(`✅ ${face.match.name} (${face.match.user_id}) marked PRESENT!`, 'Attendance Recorded');
                }
                lastAlertTimeRef.current[face.match.user_id] = now;
              }

              setMatchedFeed((prev) => {
                const recentSame = prev.slice(0, 3).find((p) => p.studentId === face.match?.user_id);
                if (recentSame && isDuplicate) {
                  return prev;
                }
                return [eventItem, ...prev].slice(0, 25);
              });
            } else {
              // Face detected, but not matched with roster
              if (!anyMatchedInThisFrame) {
                const distText = face.distance ? ` [dist: ${face.distance.toFixed(2)}]` : '';
                setScannerStatus({
                  text: `⚠️ Face detected, but not recognized in class roster${distText}.`,
                  type: 'unrecognized',
                });

                const lastUnrecAlert = lastAlertTimeRef.current['unrecognized'] || 0;
                if (now - lastUnrecAlert > 7000) {
                  error('Face detected, but does not match any enrolled student in roster.', 'Unrecognized Face');
                  lastAlertTimeRef.current['unrecognized'] = now;
                }
              }
            }
          });
        } catch (err) {
          console.error('Frame mark error:', err);
          setScannerStatus({
            text: 'Scanning connection paused, retrying next frame...',
            type: 'scanning',
          });
        }
      });
    },
    [isPaused, triggerShutterFlash, playAttendanceChime, success, error, info]
  );

  // Pause / Resume Scanning
  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        info('Camera sampling paused.', 'Paused');
      } else {
        info('Resumed camera scanning.', 'Active');
      }
      return next;
    });
  };

  // End Session: finalized backend call -> mark remaining absent
  const handleEndSession = async () => {
    if (!sessionId) return;
    setIsEndingSession(true);

    try {
      if (webcamRef.current) {
        webcamRef.current.stopLiveSampling();
      }

      const res = await api.endSession(sessionId);
      setFinalSummary(res.statistics);
      setSessionActive(false);
      success('Session finalized! Absent students have been marked.', 'Session Concluded');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to finalize session';
      error(msg, 'End Session Error');
    } finally {
      setIsEndingSession(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#8F76D9] uppercase tracking-wider mb-1">
            <Video className="w-3.5 h-3.5" />
            <span>Classroom Facial Scan</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
            Live Attendance Session
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6C86] mt-1 font-body">
            Real-time biometric recognition. Recognized students receive instant PRESENT stamps.
          </p>
        </div>

        {sessionActive && (
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="https://docs.google.com/spreadsheets/d/1BKAkxy-3k-08gQ6jKjunmCmE45YwoXmIRax5RpVnzGc/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#E8F8F0] hover:bg-[#BDEBD6] border border-[#BDEBD6] text-[#1F6B50] font-semibold text-xs shadow-soft-sm transition-all"
              title="Open Live Google Sheet (Main tab) to view or edit"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1F6B50]" />
              <span>Live Sheet (Main)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <button
              type="button"
              onClick={handleTogglePause}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                isPaused
                  ? 'bg-[#BDEBD6] border-[#A2D9BF] text-[#1F6B50]'
                  : 'bg-[#FFF1B8] border-[#E8D68E] text-[#7A6212]'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume Scanning' : 'Pause Scan'}</span>
            </button>

            <button
              type="button"
              onClick={handleEndSession}
              disabled={isEndingSession}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FFC8D6] hover:bg-[#F597AF] border border-[#F2B3C3] text-[#8C2F4B] font-semibold text-xs shadow-soft-sm transition-all"
            >
              <StopCircle className="w-4 h-4" />
              <span>{isEndingSession ? 'Finalizing...' : 'End & Finalize Session'}</span>
            </button>
          </div>
        )}
      </div>

      {/* STEP 1: SETUP FORM (WHEN NO ACTIVE SESSION) */}
      {!sessionActive && !finalSummary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft space-y-6"
        >
          <div className="border-b border-[#E7E0F5] pb-4">
            <h2 className="font-display font-black text-xl text-[#2B2A3A]">
              Configure Lecture Session
            </h2>
            <p className="text-xs text-[#6E6C86] mt-1">
              Select class details. SnapPresent will preload all registered roster students.
            </p>
          </div>

          <form onSubmit={handleStartSession} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#8F76D9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A] font-mono focus:bg-white focus:border-[#8F76D9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
                  Subject / Lecture Name *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
                Department *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-[#8F76D9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9]"
                >
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
                  Academic Year
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-[#8F76D9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A]"
                  >
                    <option value="FE">FE (First Year)</option>
                    <option value="SE">SE (Second Year)</option>
                    <option value="TE">TE (Third Year)</option>
                    <option value="BE">BE (Final Year)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
                  Division / Section
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-[#8F76D9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A]"
                  >
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-sm shadow-soft hover:shadow-soft-lg transition-all flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Initialize Classroom Camera &amp; Start Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* STEP 2: ACTIVE LIVE SPLIT VIEW */}
      {sessionActive && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Live Camera with Viewfinder (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Live Camera Viewport */}
            <div className="relative">
              <WebcamCapture
                ref={webcamRef}
                autoStart={true}
                isScanning={!isPaused}
                shutterFlash={shutterTrigger}
                title={`${subject} &bull; Div ${division}`}
                badge={isPaused ? 'Scanning Paused' : 'Live Sweeping (~2s)'}
              />
            </div>

            {/* Live AI Scanner Status Feedback HUD */}
            <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-soft-sm ${
              scannerStatus.type === 'matched'
                ? 'bg-[#E8F8F0] border-[#BDEBD6] text-[#1F6B50]'
                : scannerStatus.type === 'unrecognized'
                ? 'bg-[#FFF0F3] border-[#FFC8D6] text-[#8C2F4B]'
                : scannerStatus.type === 'warming'
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
                : 'bg-white border-[#E7E0F5] text-[#2B2A3A]'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-3 h-3 rounded-full shrink-0 ${
                  scannerStatus.type === 'matched'
                    ? 'bg-[#2E9E74] ring-4 ring-[#BDEBD6] animate-pulse'
                    : scannerStatus.type === 'unrecognized'
                    ? 'bg-[#D64567] ring-4 ring-[#FFC8D6] animate-pulse'
                    : scannerStatus.type === 'warming'
                    ? 'bg-[#3B82F6] ring-4 ring-[#BFDBFE] animate-pulse'
                    : 'bg-[#8F76D9] ring-4 ring-[#E7E0F5] animate-pulse'
                }`} />
                <span className="text-xs font-mono font-semibold truncate">
                  {scannerStatus.text}
                </span>
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 font-bold ${
                scannerStatus.type === 'matched'
                  ? 'bg-[#BDEBD6] text-[#1F6B50]'
                  : scannerStatus.type === 'unrecognized'
                  ? 'bg-[#FFC8D6] text-[#8C2F4B]'
                  : scannerStatus.type === 'warming'
                  ? 'bg-[#BFDBFE] text-[#1E40AF]'
                  : 'bg-[#F4EFFF] text-[#8F76D9]'
              }`}>
                {scannerStatus.type === 'matched' ? 'VERIFIED' : scannerStatus.type === 'unrecognized' ? 'NO MATCH' : scannerStatus.type === 'warming' ? 'CONNECTING' : 'SCANNING'}
              </span>
            </div>

            {/* Live Counters Banner */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0F5] shadow-xs text-center">
                <div className="text-[11px] font-mono text-[#6E6C86]">Present Now</div>
                <div className="font-display font-black text-2xl text-[#1F6B50] mt-0.5">
                  {totalPresentNow}
                </div>
                <div className="text-[10px] text-[#6E6C86]">of {studentsPreloaded} students</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0F5] shadow-xs text-center">
                <div className="text-[11px] font-mono text-[#6E6C86]">Recent Matches</div>
                <div className="font-display font-black text-2xl text-[#8F76D9] mt-0.5">
                  {matchedFeed.length}
                </div>
                <div className="text-[10px] text-[#6E6C86]">polaroid events</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E7E0F5] shadow-xs text-center">
                <div className="text-[11px] font-mono text-[#6E6C86]">Dupes Prevented</div>
                <div className="font-display font-black text-2xl text-[#8A4A2B] mt-0.5">
                  {duplicatesPrevented}
                </div>
                <div className="text-[10px] text-[#6E6C86]">double-counts avoided</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Polaroid Matches Feed (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="font-display font-bold text-base text-[#2B2A3A]">
                  Matched Student Polaroids
                </h3>
                <p className="text-xs text-[#6E6C86]">
                  Real-time facial verification &bull; DeepFace Facenet512
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#BDEBD6] text-[#1F6B50] font-bold">
                {matchedFeed.length} Snapped
              </span>
            </div>

            {matchedFeed.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-[#E7E0F5] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F4EFFF] flex items-center justify-center mx-auto text-[#8F76D9] animate-pulse">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-sm text-[#2B2A3A]">
                  Scanning Classroom Faces...
                </h4>
                <p className="text-xs text-[#6E6C86] max-w-xs mx-auto leading-relaxed">
                  As students look towards the camera, recognized faces develop into verified
                  polaroid snapshot cards here.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {matchedFeed.map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.9, y: 16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="p-3.5 rounded-2xl bg-white border border-[#E7E0F5] shadow-polaroid flex items-center gap-3.5 hover:shadow-soft transition-all"
                    >
                      {/* Photo Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-[#F4EFFF] border border-[#E7E0F5] overflow-hidden shrink-0">
                        {event.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.thumbnail}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8F76D9]">
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-sm text-[#2B2A3A] truncate">
                            {event.name}
                          </h4>
                          <span className="text-[10px] font-mono text-[#6E6C86]">
                            {event.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-mono text-[#6E6C86] truncate">
                            {event.studentId}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F4EFFF] text-[#8F76D9]">
                            {event.confidence.toFixed(1)}% match
                          </span>
                        </div>
                      </div>

                      {/* Stamp Indicator */}
                      <div className="shrink-0 pl-1">
                        <StatusStamp
                          status={event.alreadyMarked ? 'duplicate' : 'present'}
                          size="sm"
                          animate={idx === 0}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: FINAL SUMMARY MODAL / CARD */}
      {finalSummary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-lg space-y-6 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#BDEBD6] text-[#1F6B50] flex items-center justify-center mx-auto shadow-soft-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-mono uppercase font-bold text-[#1F6B50]">
              Session Concluded Successfully
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A] mt-1">
              Final Attendance Summary
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6C86] mt-1">
              {subject} &bull; {department} &bull; {year} Div {division} &bull; {date}
            </p>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[#F4EFFF] border border-[#E7E0F5]">
              <div className="text-xs font-mono text-[#6E6C86]">Class Total</div>
              <div className="font-display font-black text-3xl text-[#2B2A3A] mt-1">
                {finalSummary.total_students}
              </div>
              <div className="text-[11px] text-[#6E6C86]">students in roster</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#BDEBD6]/40 border border-[#BDEBD6]">
              <div className="text-xs font-mono text-[#1F6B50]">Present</div>
              <div className="font-display font-black text-3xl text-[#1F6B50] mt-1">
                {finalSummary.present_count}
              </div>
              <div className="text-[11px] text-[#1F6B50]">
                {finalSummary.total_students > 0
                  ? Math.round(
                      (finalSummary.present_count / finalSummary.total_students) * 100
                    )
                  : 0}
                % attendance
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFC8D6]/40 border border-[#FFC8D6]">
              <div className="text-xs font-mono text-[#8C2F4B]">Absent</div>
              <div className="font-display font-black text-3xl text-[#8C2F4B] mt-1">
                {finalSummary.absent_count}
              </div>
              <div className="text-[11px] text-[#8C2F4B]">auto-marked absent</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[#E7E0F5]">
            <Link
              href="/dashboard/faculty/records"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-xs sm:text-sm shadow-soft transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>View Attendance Records &amp; Export</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setFinalSummary(null);
                setSessionActive(false);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-[#F4EFFF] border border-[#E7E0F5] text-xs sm:text-sm font-semibold text-[#2B2A3A] transition-all"
            >
              <span>Start Another Session</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
