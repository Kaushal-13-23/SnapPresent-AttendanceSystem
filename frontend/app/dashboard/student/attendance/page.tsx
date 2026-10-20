'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck2,
  Filter,
  RotateCcw,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, AttendanceRecord, AttendanceStats, StudentRecord } from '@/lib/api';
import { StatusStamp } from '@/components/StatusStamp';
import { SkeletonCard, SkeletonTable } from '@/components/Skeleton';

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [studentRecord, setStudentRecord] = useState<StudentRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');

  const fetchAttendance = useCallback(async (sid: string) => {
    setIsLoading(true);
    try {
      const response = await api.getAttendance({
        student_id: sid,
        date: selectedDate || undefined,
        subject: selectedSubject || undefined,
      });

      if (response && response.success) {
        setRecords(response.attendance || []);
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Failed to load attendance records', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedSubject]);

  useEffect(() => {
    async function init() {
      try {
        const ownRes = await api.getOwnStudentRecords().catch(() => ({ students: [] }));
        if (ownRes.students && ownRes.students.length > 0) {
          const s = ownRes.students[0];
          setStudentRecord(s);
          await fetchAttendance(s.studentId);
        } else if (user?.studentId) {
          await fetchAttendance(user.studentId);
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    }
    init();
  }, [user?.studentId, fetchAttendance]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const sid = studentRecord?.studentId || user?.studentId;
    if (sid) {
      fetchAttendance(sid);
    }
  };

  const handleResetFilters = () => {
    setSelectedDate('');
    setSelectedSubject('');
    setStatusFilter('all');
    const sid = studentRecord?.studentId || user?.studentId;
    if (sid) {
      setIsLoading(true);
      api
        .getAttendance({ student_id: sid })
        .then((res) => {
          setRecords(res.attendance || []);
          setStats(res.stats);
        })
        .finally(() => setIsLoading(false));
    }
  };

  // Filter records locally by status tab
  const filteredRecords = records.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#8F76D9] uppercase tracking-wider mb-1">
          <CalendarCheck2 className="w-3.5 h-3.5" />
          <span>My Attendance Records</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
          Attendance Snapshot
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6C86] mt-1 font-body">
          Complete log of lecture sessions and presence stamps linked to your student ID.
        </p>
      </div>

      {/* Stat Cards Row */}
      {isLoading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Rate */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Attendance Rate</span>
              <div className="w-7 h-7 rounded-xl bg-[#C9B6F2] flex items-center justify-center text-[#2B2A3A]">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
              {stats ? `${stats.attendanceRate}%` : '0%'}
            </div>
            <div className="mt-1 text-[11px] text-[#1F6B50] font-medium">
              Target &ge; 75% for exam eligibility
            </div>
          </div>

          {/* Card 2: Total Sessions */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Total Classes</span>
              <div className="w-7 h-7 rounded-xl bg-[#BFE0FF] flex items-center justify-center text-[#24577F]">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
              {stats ? stats.totalStudents : records.length}
            </div>
            <div className="mt-1 text-[11px] text-[#6E6C86] font-mono">
              Recorded in your timetable
            </div>
          </div>

          {/* Card 3: Present */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Marked Present</span>
              <div className="w-7 h-7 rounded-xl bg-[#BDEBD6] flex items-center justify-center text-[#1F6B50]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#1F6B50]">
              {stats ? stats.presentToday : records.filter((r) => r.status === 'present').length}
            </div>
            <div className="mt-1 text-[11px] text-[#1F6B50] font-medium">
              Verified by facial scan
            </div>
          </div>

          {/* Card 4: Absent */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Marked Absent</span>
              <div className="w-7 h-7 rounded-xl bg-[#FFC8D6] flex items-center justify-center text-[#8C2F4B]">
                <XCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#8C2F4B]">
              {stats ? stats.absentToday : records.filter((r) => r.status === 'absent').length}
            </div>
            <div className="mt-1 text-[11px] text-[#8C2F4B] font-medium">
              Missed or unverified
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#8F76D9] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs font-mono text-[#2B2A3A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Subject</label>
            <input
              type="text"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              placeholder="e.g. Machine Learning"
              className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'present' | 'absent')}
              className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
            >
              <option value="all">All Records</option>
              <option value="present">Only Present</option>
              <option value="absent">Only Absent</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-xs transition-all shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="p-2 rounded-2xl bg-[#F4EFFF] hover:bg-[#E7E0F5] text-[#6E6C86] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Attendance Records Table */}
      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-[#E7E0F5] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4EFFF] flex items-center justify-center mx-auto text-[#8F76D9]">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-base text-[#2B2A3A]">
            No Attendance Entries Found
          </h3>
          <p className="text-xs text-[#6E6C86] max-w-sm mx-auto">
            {selectedDate || selectedSubject || statusFilter !== 'all'
              ? 'No sessions match your filter criteria. Try resetting filters.'
              : 'You have not been scanned into any live attendance sessions yet.'}
          </p>
          {(selectedDate || selectedSubject || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8F76D9] hover:underline pt-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear active filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E7E0F5] shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4EFFF] border-b border-[#E7E0F5] text-[#6E6C86] uppercase font-mono tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Subject / Lecture</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Time Verified</th>
                  <th className="py-3.5 px-5">Division / Year</th>
                  <th className="py-3.5 px-5 text-right">Attendance Stamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0F5]/60 font-body">
                {filteredRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-[#FBF9FF] transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-sm text-[#2B2A3A]">
                        {r.subject || 'Lecture Session'}
                      </div>
                      <div className="text-[11px] text-[#6E6C86] font-mono">{r.department}</div>
                    </td>
                    <td className="py-4 px-5 font-mono text-[#6E6C86]">{r.date}</td>
                    <td className="py-4 px-5 font-mono text-[#6E6C86]">
                      {r.markedAt ? r.markedAt.substring(11, 19) : '—'}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#6E6C86]">
                      {r.year} &bull; Div {r.division}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <StatusStamp status={r.status} size="sm" animate={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E7E0F5] flex items-center justify-between text-xs text-[#6E6C86] font-mono">
            <span>Showing {filteredRecords.length} records</span>
            <span>SnapPresent Facial Log</span>
          </div>
        </div>
      )}
    </div>
  );
}
