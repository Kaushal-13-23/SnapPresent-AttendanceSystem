'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Video,
  FileSpreadsheet,
  CheckCircle2,
  Building,
  Sparkles,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, StudentStats, ModelsStatusResponse } from '@/lib/api';
import { SkeletonCard } from '@/components/Skeleton';

export default function FacultyOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelsStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadFacultyDashboard() {
      setIsLoading(true);
      try {
        const [statsRes, modelRes] = await Promise.all([
          api.getStudentStats().catch(() => null),
          api.getModelsStatus().catch(() => null),
        ]);

        if (statsRes?.stats) {
          setStats(statsRes.stats);
        }
        if (modelRes) {
          setModelStatus(modelRes);
        }
      } catch (err) {
        console.error('Faculty dashboard load failed', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFacultyDashboard();
  }, []);

  const totalStudents = stats?.total_students ?? 0;
  const faceRegistered = stats?.face_registered ?? 0;
  const registrationRate =
    totalStudents > 0 ? Math.round((faceRegistered / totalStudents) * 100) : 0;
  const departmentsCount = stats?.by_department?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome & Live Session Launcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#F4EFFF] via-white to-[#FBF9FF] border border-[#E7E0F5] shadow-soft-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#8F76D9] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Faculty Command Center</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
            Welcome, Prof. {user?.username || 'Faculty'} 🎓
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6C86] mt-1 font-body">
            Department of {user?.department || 'Engineering'}. Manage student biometrics and launch
            real-time attendance sessions.
          </p>
        </div>

        <Link
          href="/dashboard/faculty/session"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-xs sm:text-sm shadow-soft hover:shadow-soft-lg transition-all self-start sm:self-auto shrink-0"
        >
          <Video className="w-4 h-4" />
          <span>Start Live Session</span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>

      {/* Primary Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Students */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Total Students</span>
              <div className="w-8 h-8 rounded-xl bg-[#F4EFFF] text-[#8F76D9] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-[#2B2A3A]">
              {totalStudents}
            </div>
            <div className="mt-1.5 text-[11px] text-[#6E6C86] font-mono">
              Enrolled in database
            </div>
          </div>

          {/* Card 2: Face Registered */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Face Registered</span>
              <div className="w-8 h-8 rounded-xl bg-[#BDEBD6] text-[#1F6B50] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-[#1F6B50]">
              {faceRegistered}
            </div>
            <div className="mt-1.5 text-[11px] text-[#1F6B50] font-medium">
              {registrationRate}% ready for camera scan
            </div>
          </div>

          {/* Card 3: Active Departments */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Departments</span>
              <div className="w-8 h-8 rounded-xl bg-[#FFD3BD] text-[#8A4A2B] flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-[#2B2A3A]">
              {departmentsCount}
            </div>
            <div className="mt-1.5 text-[11px] text-[#8A4A2B] font-mono">
              Academic branches configured
            </div>
          </div>

          {/* Card 4: AI Model Status */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">AI Engine</span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  modelStatus?.models_ready
                    ? 'bg-[#BDEBD6] text-[#1F6B50]'
                    : 'bg-[#FFF1B8] text-[#7A6212]'
                }`}
              >
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-black text-lg text-[#2B2A3A] truncate">
              {modelStatus?.models_ready ? 'MTCNN & Facenet' : 'Warming Up'}
            </div>
            <div className="mt-1.5 text-[11px] font-mono flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  modelStatus?.models_ready ? 'bg-[#1F6B50]' : 'bg-[#7A6212] animate-pulse'
                }`}
              />
              <span className={modelStatus?.models_ready ? 'text-[#1F6B50]' : 'text-[#7A6212]'}>
                {modelStatus?.models_ready ? 'Cosine Thresh 0.60' : 'Backend Initializing'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Launch & Action Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/faculty/session"
          className="p-5 rounded-3xl bg-[#F4EFFF] border border-[#E7E0F5] hover:border-[#8F76D9] transition-all flex items-center gap-4 shadow-soft-sm group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#C9B6F2] flex items-center justify-center text-[#2B2A3A] group-hover:scale-105 transition-transform shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-[#2B2A3A]">
              Launch Live Session
            </div>
            <div className="text-xs text-[#6E6C86]">Start webcam scanning &amp; presence feed</div>
          </div>
        </Link>

        <Link
          href="/dashboard/faculty/students"
          className="p-5 rounded-3xl bg-white border border-[#E7E0F5] hover:border-[#8F76D9] transition-all flex items-center gap-4 shadow-soft-sm group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#BFE0FF] flex items-center justify-center text-[#24577F] group-hover:scale-105 transition-transform shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-[#2B2A3A]">
              Student Directory
            </div>
            <div className="text-xs text-[#6E6C86]">Search, edit or delete enrolled students</div>
          </div>
        </Link>

        <Link
          href="/dashboard/faculty/records"
          className="p-5 rounded-3xl bg-white border border-[#E7E0F5] hover:border-[#8F76D9] transition-all flex items-center gap-4 shadow-soft-sm group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#BDEBD6] flex items-center justify-center text-[#1F6B50] group-hover:scale-105 transition-transform shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-[#2B2A3A]">
              Attendance Records
            </div>
            <div className="text-xs text-[#6E6C86]">View filters and export to Excel (.xlsx)</div>
          </div>
        </Link>
      </div>

      {/* Breakdowns: By Department & By Year */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E0F5] pb-3">
            <h3 className="font-display font-bold text-base text-[#2B2A3A]">
              Students by Department
            </h3>
            <span className="text-xs font-mono text-[#6E6C86]">Count</span>
          </div>

          {!stats || !stats.by_department || stats.by_department.length === 0 ? (
            <p className="text-xs text-[#6E6C86] py-6 text-center font-mono">
              No department data available
            </p>
          ) : (
            <div className="space-y-3">
              {stats.by_department.map((dept, i) => {
                const percentage =
                  totalStudents > 0 ? Math.round((dept.count / totalStudents) * 100) : 0;

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-[#2B2A3A]">
                      <span className="truncate">{dept._id || 'Unassigned'}</span>
                      <span className="font-mono text-[#6E6C86]">
                        {dept.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F4EFFF] overflow-hidden">
                      <div
                        className="h-full bg-[#C9B6F2] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Year Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E0F5] pb-3">
            <h3 className="font-display font-bold text-base text-[#2B2A3A]">
              Students by Academic Year
            </h3>
            <span className="text-xs font-mono text-[#6E6C86]">Distribution</span>
          </div>

          {!stats || !stats.by_year || stats.by_year.length === 0 ? (
            <p className="text-xs text-[#6E6C86] py-6 text-center font-mono">
              No academic year data available
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {stats.by_year.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-[#F4EFFF] border border-[#E7E0F5] text-center"
                >
                  <div className="text-xs font-mono font-semibold text-[#8F76D9] uppercase">
                    {item._id || 'Other'}
                  </div>
                  <div className="font-display font-black text-2xl text-[#2B2A3A] mt-1">
                    {item.count}
                  </div>
                  <div className="text-[10px] text-[#6E6C86] font-mono">students</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
