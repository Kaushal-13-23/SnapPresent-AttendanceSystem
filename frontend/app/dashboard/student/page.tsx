'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  CalendarCheck2,
  User,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, StudentRecord, AttendanceRecord, AttendanceStats } from '@/lib/api';
import { StatusStamp } from '@/components/StatusStamp';
import { SkeletonCard } from '@/components/Skeleton';

export default function StudentOverviewPage() {
  const { user } = useAuth();
  const [studentRecord, setStudentRecord] = useState<StudentRecord | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStudentData() {
      setIsLoading(true);
      try {
        // Fetch own student record
        const recordRes = await api.getOwnStudentRecords().catch(() => ({ students: [] }));
        if (recordRes.students && recordRes.students.length > 0) {
          const own = recordRes.students[0];
          setStudentRecord(own);

          // Fetch attendance records for this student
          const attRes = await api
            .getAttendance({ student_id: own.studentId })
            .catch(() => null);

          if (attRes) {
            setRecentAttendance(attRes.attendance.slice(0, 5));
            setAttendanceStats(attRes.stats);
          }
        }
      } catch (err) {
        console.error('Failed to load student overview data', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentData();
  }, []);

  const isFaceEnrolled = !!(studentRecord?.face_registered || user?.hasStudentRecord);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#F4EFFF] via-white to-[#FBF9FF] border border-[#E7E0F5] shadow-soft-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#8F76D9] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Dashboard</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
            Hi, {user?.username || studentRecord?.studentName || 'Student'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6C86] mt-1 font-body">
            Welcome to your attendance snapshot. Everything is synchronized with your biometrics.
          </p>
        </div>

        {/* Quick Action */}
        {!isFaceEnrolled && (
          <Link
            href="/dashboard/student/register"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-xs sm:text-sm shadow-soft hover:shadow-soft-lg transition-all self-start sm:self-auto shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Complete Face Enrollment</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Biometric Enrollment Status */}
            <div className="p-6 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#6E6C86]">
                    Biometric Status
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isFaceEnrolled
                        ? 'bg-[#BDEBD6] text-[#1F6B50]'
                        : 'bg-[#FFF1B8] text-[#7A6212]'
                    }`}
                  >
                    {isFaceEnrolled ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <h3 className="font-display font-black text-xl text-[#2B2A3A]">
                  {isFaceEnrolled ? 'Face Enrolled' : 'Enrollment Required'}
                </h3>
                <p className="text-xs text-[#6E6C86] mt-1 leading-relaxed">
                  {isFaceEnrolled
                    ? 'Your 5-angle Facenet vector embeddings are active and recognized in classroom scans.'
                    : 'You must capture 5 webcam frames to be automatically marked present during lectures.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E7E0F5]">
                {isFaceEnrolled ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#1F6B50]">
                    <span className="w-2 h-2 rounded-full bg-[#BDEBD6]" />
                    Ready for live sessions
                  </span>
                ) : (
                  <Link
                    href="/dashboard/student/register"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8F76D9] hover:underline"
                  >
                    <span>Start 5-frame enrollment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* 2. Overall Attendance Rate */}
            <div className="p-6 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#6E6C86]">
                    Attendance Rate
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#BFE0FF] text-[#24577F] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="font-display font-black text-3xl sm:text-4xl text-[#2B2A3A]">
                    {attendanceStats ? `${attendanceStats.attendanceRate}%` : '—'}
                  </h3>
                  <span className="text-xs font-mono text-[#6E6C86]">this term</span>
                </div>
                <p className="text-xs text-[#6E6C86] mt-2">
                  {attendanceStats
                    ? `${attendanceStats.presentToday} classes marked present, ${attendanceStats.absentToday} absent.`
                    : 'No attendance records logged yet.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E7E0F5]">
                <Link
                  href="/dashboard/student/attendance"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#8F76D9] hover:underline"
                >
                  <span>View detailed log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. Academic Profile Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#6E6C86]">
                    Academic Roster
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#FFD3BD] text-[#8A4A2B] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-[#2B2A3A] truncate">
                  {studentRecord?.department || user?.department || 'Unassigned Dept'}
                </h3>
                <div className="mt-2 space-y-1 text-xs font-mono text-[#6E6C86]">
                  <div>
                    ID: <span className="text-[#2B2A3A] font-semibold">{studentRecord?.studentId || 'Pending'}</span>
                  </div>
                  <div>
                    Class:{' '}
                    <span className="text-[#2B2A3A]">
                      {studentRecord?.year || '—'} &bull; Div {studentRecord?.division || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E7E0F5]">
                <Link
                  href="/dashboard/student/profile"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#8F76D9] hover:underline"
                >
                  <span>Edit profile details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links Nav Strip */}
          <div className="p-4 rounded-3xl bg-[#F4EFFF] border border-[#E7E0F5] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/dashboard/student/register"
              className="p-3.5 rounded-2xl bg-white hover:bg-[#FBF9FF] border border-[#E7E0F5] flex items-center gap-3 transition-colors shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-[#C9B6F2] flex items-center justify-center text-[#2B2A3A]">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-[#2B2A3A]">
                  Register Face
                </div>
                <div className="text-[11px] text-[#6E6C86]">5-angle camera capture</div>
              </div>
            </Link>

            <Link
              href="/dashboard/student/attendance"
              className="p-3.5 rounded-2xl bg-white hover:bg-[#FBF9FF] border border-[#E7E0F5] flex items-center gap-3 transition-colors shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-[#BDEBD6] flex items-center justify-center text-[#1F6B50]">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-[#2B2A3A]">
                  My Attendance
                </div>
                <div className="text-[11px] text-[#6E6C86]">Filter by date &amp; subject</div>
              </div>
            </Link>

            <Link
              href="/dashboard/student/profile"
              className="p-3.5 rounded-2xl bg-white hover:bg-[#FBF9FF] border border-[#E7E0F5] flex items-center gap-3 transition-colors shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FFD3BD] flex items-center justify-center text-[#8A4A2B]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-[#2B2A3A]">
                  Student Profile
                </div>
                <div className="text-[11px] text-[#6E6C86]">View or update info</div>
              </div>
            </Link>
          </div>

          {/* Recent Attendance Snapshot */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-[#2B2A3A]">
                  Recent Attendance Snapshots
                </h2>
                <p className="text-xs text-[#6E6C86]">Latest lecture sessions recorded for your ID</p>
              </div>
              <Link
                href="/dashboard/student/attendance"
                className="text-xs font-mono font-bold text-[#8F76D9] hover:text-[#2B2A3A]"
              >
                View all &rarr;
              </Link>
            </div>

            {recentAttendance.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-[#E7E0F5] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F4EFFF] flex items-center justify-center mx-auto text-[#8F76D9]">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-sm text-[#2B2A3A]">
                  No Attendance Snapshots Yet
                </h3>
                <p className="text-xs text-[#6E6C86] max-w-sm mx-auto">
                  Once your teachers launch a live face-recognition session, your status stamps will
                  appear right here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#E7E0F5] shadow-soft-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F4EFFF] border-b border-[#E7E0F5] text-[#6E6C86] uppercase font-mono tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Time Marked</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E0F5]/60 font-body">
                      {recentAttendance.map((record, idx) => (
                        <tr key={idx} className="hover:bg-[#FBF9FF] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#2B2A3A]">
                            {record.subject || 'Lecture'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#6E6C86]">{record.date}</td>
                          <td className="py-3.5 px-4 font-mono text-[#6E6C86]">
                            {record.markedAt ? record.markedAt.substring(11, 16) : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <StatusStamp status={record.status} size="sm" animate={false} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
