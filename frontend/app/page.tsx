'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Camera,
  ShieldCheck,
  Video,
  CheckCircle2,
  ArrowRight,
  Database,
  Lock,
  Download,
  GraduationCap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PolaroidCard } from '@/components/PolaroidCard';

export default function LandingPage() {
  // Animated Hero Polaroid stack developing in one by one
  const [developedCards, setDevelopedCards] = useState<number>(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDevelopedCards((prev) => (prev < 4 ? prev + 1 : 1));
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const sampleStudents = [
    {
      name: 'Aarav Sharma',
      id: 'STU-2026-041',
      dept: 'Computer Engineering',
      time: '09:02 AM',
      conf: 98.4,
      rot: -4,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Diya Patel',
      id: 'STU-2026-088',
      dept: 'Information Tech',
      time: '09:02 AM',
      conf: 99.1,
      rot: 3,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rohan Verma',
      id: 'STU-2026-112',
      dept: 'AI & Data Science',
      time: '09:03 AM',
      conf: 97.8,
      rot: -2,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Ananya Iyer',
      id: 'STU-2026-149',
      dept: 'Electronics',
      time: '09:03 AM',
      conf: 99.5,
      rot: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9FF] text-[#2B2A3A] relative overflow-hidden flex flex-col">
      <Navbar />

      {/* Ambient Pastel Blurred Blobs */}
      <div className="absolute top-16 left-1/4 w-96 h-96 bg-[#C9B6F2]/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-36 right-1/4 w-80 h-80 bg-[#FFD3BD]/35 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 left-1/3 w-96 h-96 bg-[#BFE0FF]/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* HERO SECTION */}
      <section className="pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            {/* Pill tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4EFFF] border border-[#E7E0F5] text-xs font-mono font-semibold text-[#8F76D9] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#BDEBD6] animate-pulse" />
              <span>Face Recognition Attendance &bull; Soft Snapshot</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-[#2B2A3A] tracking-tight leading-[1.08]">
              Every moment of attendance is a{' '}
              <span className="inline-block relative">
                <span className="relative z-10 text-[#2B2A3A]">snapshot.</span>
                <span className="absolute bottom-1 left-0 right-0 h-3.5 bg-[#C9B6F2]/60 -rotate-1 -z-0 rounded-sm" />
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#6E6C86] max-w-2xl leading-relaxed font-body">
              Enroll your face once with 5 quick webcam angles. When faculty start a live lecture,
              our camera scans the room, recognizes students in real time, and marks them present
              instantly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                href="/signin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-sm shadow-soft hover:shadow-soft-lg transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Launch Live Session</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white hover:bg-[#F4EFFF] text-[#2B2A3A] font-semibold text-sm border border-[#E7E0F5] shadow-soft-sm hover:shadow-soft transition-all"
              >
                <Camera className="w-4 h-4 text-[#8F76D9]" />
                <span>Enroll Face as Student</span>
              </Link>
            </div>

            {/* Mini Trust Stats */}
            <div className="pt-6 border-t border-[#E7E0F5]/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#6E6C86] font-mono">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#BDEBD6] flex items-center justify-center text-[#1F6B50]">
                  &check;
                </div>
                <span>512-D Facenet Vectors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#BFE0FF] flex items-center justify-center text-[#24577F]">
                  &check;
                </div>
                <span>2s Real-Time Sampling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#FFD3BD] flex items-center justify-center text-[#8A4A2B]">
                  &check;
                </div>
                <span>Zero Raw Photos Saved</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero: Developing Polaroid Stack Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm h-96 flex items-center justify-center">
              {/* Developing Polaroid Stack */}
              {sampleStudents.slice(0, developedCards).map((student, idx) => (
                <div
                  key={student.id}
                  className="absolute transition-all duration-500 ease-out"
                  style={{
                    transform: `translate(${idx * 14 - 20}px, ${idx * 16 - 20}px) rotate(${student.rot}deg)`,
                    zIndex: idx + 1,
                  }}
                >
                  <PolaroidCard
                    name={student.name}
                    studentId={student.id}
                    timestamp={student.time}
                    confidence={student.conf}
                    imageSrc={student.avatar}
                    status="present"
                    rotation={0}
                    showTape={idx === developedCards - 1}
                    size="md"
                    aspectRatio="square"
                    className="shadow-soft-lg"
                  />
                </div>
              ))}
            </div>

            {/* Developing status ticker */}
            <div className="mt-6 flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-[#E7E0F5] shadow-soft-sm">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8F76D9] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8F76D9]" />
              </span>
              <span className="text-xs font-mono font-medium text-[#2B2A3A]">
                Developing snapshot {developedCards} of 4: Matched PRESENT
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 STEPS) */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#E7E0F5]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#8F76D9]">
              Effortless Workflow
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#2B2A3A]">
              Three steps from setup to verified presence
            </h2>
            <p className="text-sm text-[#6E6C86]">
              Designed to replace manual roll-calls and proxy cards with camera-accurate biometric
              snapshots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-[#FBF9FF] border border-[#E7E0F5] shadow-soft-sm space-y-4 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#C9B6F2] text-[#2B2A3A] flex items-center justify-center font-display font-black text-lg shadow-xs">
                01
              </div>
              <h3 className="font-display font-bold text-lg text-[#2B2A3A]">
                5-Frame Student Enrollment
              </h3>
              <p className="text-xs leading-relaxed text-[#6E6C86]">
                Students enroll once from any device. Our guided viewfinder prompts 5 angles (straight,
                left, right, chin up, neutral) to extract robust Facenet512 vector embeddings.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-[#8F76D9]">
                <Camera className="w-3.5 h-3.5" />
                <span>Takes less than 30 seconds</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-[#FBF9FF] border border-[#E7E0F5] shadow-soft-sm space-y-4 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD3BD] text-[#8A4A2B] flex items-center justify-center font-display font-black text-lg shadow-xs">
                02
              </div>
              <h3 className="font-display font-bold text-lg text-[#2B2A3A]">
                Faculty Runs Live Session
              </h3>
              <p className="text-xs leading-relaxed text-[#6E6C86]">
                Teacher selects the lecture, room, and division. The camera sweeps the classroom,
                sampling every 2s with duplicate prevention to match recognized students on the fly.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-[#8A4A2B]">
                <Video className="w-3.5 h-3.5" />
                <span>Zero interruptions to class</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-[#FBF9FF] border border-[#E7E0F5] shadow-soft-sm space-y-4 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#BDEBD6] text-[#1F6B50] flex items-center justify-center font-display font-black text-lg shadow-xs">
                03
              </div>
              <h3 className="font-display font-bold text-lg text-[#2B2A3A]">
                Instant Presence &amp; Export
              </h3>
              <p className="text-xs leading-relaxed text-[#6E6C86]">
                Recognized faces develop into polaroids marked PRESENT. When the session concludes,
                all remaining unverified roster students are marked ABSENT and exported to Excel.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-[#1F6B50]">
                <Download className="w-3.5 h-3.5" />
                <span>1-click SheetJS .xlsx export</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DUAL HIGHLIGHTS: FOR STUDENTS & FOR FACULTY */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Students */}
          <div
            id="for-students"
            className="p-8 rounded-3xl bg-[#F4EFFF] border border-[#E7E0F5] space-y-6 shadow-soft"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9B6F2] text-[#2B2A3A] text-xs font-mono font-bold">
              <GraduationCap className="w-4 h-4" />
              <span>For Students</span>
            </div>
            <h3 className="font-display font-black text-2xl text-[#2B2A3A]">
              No sign-in sheets. Just walk in and learn.
            </h3>
            <ul className="space-y-3.5 text-sm text-[#6E6C86]">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#BDEBD6] text-[#1F6B50] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                  &check;
                </span>
                <span>One-time 5-frame face registration with retake and angle feedback.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#BDEBD6] text-[#1F6B50] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                  &check;
                </span>
                <span>Personal attendance portal with percentage rate and filterable history.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#BDEBD6] text-[#1F6B50] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                  &check;
                </span>
                <span>Guaranteed biometric privacy: only mathematical embeddings are stored.</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#8F76D9] hover:text-[#2B2A3A]"
            >
              <span>Register as a student</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* For Faculty */}
          <div
            id="for-faculty"
            className="p-8 rounded-3xl bg-white border border-[#E7E0F5] space-y-6 shadow-soft"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD3BD] text-[#8A4A2B] text-xs font-mono font-bold">
              <Video className="w-4 h-4" />
              <span>For Faculty</span>
            </div>
            <h3 className="font-display font-black text-2xl text-[#2B2A3A]">
              Live classroom surveillance with instant polaroid feed.
            </h3>
            <ul className="space-y-3.5 text-sm text-[#6E6C86]">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FFD3BD] text-[#8A4A2B] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                  &check;
                </span>
                <span>Split-view live session with viewfinder brackets and real-time counter pills.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FFD3BD] text-[#8A4A2B] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                  &check;
                </span>
                <span>Duplicate detection prevents double-counting and notifies faculty cleanly.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FFD3BD] text-[#8A4A2B] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                  &check;
                </span>
                <span>Auto-marks absent students upon session wrap-up with 1-click Excel export.</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#8A4A2B] hover:text-[#2B2A3A]"
            >
              <span>Create teacher account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* PRIVACY & TRUST SECTION */}
      <section id="privacy" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F4EFFF] border-y border-[#E7E0F5]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E7E0F5] text-xs font-mono font-semibold text-[#8F76D9]">
            <Lock className="w-3.5 h-3.5 text-[#8F76D9]" />
            <span>Privacy-First Architecture</span>
          </div>

          <h2 className="font-display font-black text-3xl sm:text-4xl text-[#2B2A3A]">
            Only mathematical vector embeddings are stored.
          </h2>

          <p className="text-sm sm:text-base text-[#6E6C86] leading-relaxed max-w-2xl mx-auto font-body">
            SnapPresent does not retain webcam images or biometric photos in its database. When you
            enroll or mark attendance, DeepFace computes an irreversible 512-dimensional vector. The
            underlying image bytes are immediately wiped from memory.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
            <div className="p-4 rounded-2xl bg-white border border-[#E7E0F5] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-[#BDEBD6] text-[#1F6B50] flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-sm text-[#2B2A3A]">Non-Reversible</h4>
              <p className="text-xs text-[#6E6C86] mt-1">
                Vector points cannot be reconstructed into a human face photograph.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E7E0F5] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-[#BFE0FF] text-[#24577F] flex items-center justify-center mb-2">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-sm text-[#2B2A3A]">MongoDB Storage</h4>
              <p className="text-xs text-[#6E6C86] mt-1">
                Cosine similarity matching indexed strictly against enrolled student vectors.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E7E0F5] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-[#FFF1B8] text-[#7A6212] flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-sm text-[#2B2A3A]">GDPR / FERPA Compliant</h4>
              <p className="text-xs text-[#6E6C86] mt-1">
                Students can remove or update their enrollment record anytime from their profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-12 px-4 sm:px-6 lg:px-8 border-t border-[#E7E0F5] bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#6E6C86]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#C9B6F2] flex items-center justify-center text-[#2B2A3A]">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-sm text-[#2B2A3A]">SnapPresent</span>
            <span className="font-mono text-[11px]">&copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/signin" className="hover:text-[#2B2A3A] transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-[#2B2A3A] transition-colors">
              Sign Up
            </Link>
            <a href="#how-it-works" className="hover:text-[#2B2A3A] transition-colors">
              How It Works
            </a>
            <a href="#privacy" className="hover:text-[#2B2A3A] transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
