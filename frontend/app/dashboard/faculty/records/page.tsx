'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Filter,
  RotateCcw,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { api, AttendanceRecord, AttendanceStats } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { StatusStamp } from '@/components/StatusStamp';
import { SkeletonCard, SkeletonTable } from '@/components/Skeleton';

export default function FacultyRecordsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filter criteria
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState<string>('');
  const [department, setDepartment] = useState<string>(user?.department || 'Computer Engineering');
  const [year, setYear] = useState<string>('TE');
  const [division, setDivision] = useState<string>('A');

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAttendance({
        date: date || undefined,
        subject: subject || undefined,
        department: department || undefined,
        year: year || undefined,
        division: division || undefined,
      });

      if (res && res.success) {
        setRecords(res.attendance || []);
        setStats(res.stats);
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to fetch attendance records';
      error(msg, 'Fetch Error');
    } finally {
      setIsLoading(false);
    }
  }, [date, subject, department, year, division, error]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleReset = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setSubject('');
    setDepartment(user?.department || 'Computer Engineering');
    setYear('TE');
    setDivision('A');
    setIsLoading(true);
    api
      .getAttendance({
        date: new Date().toISOString().split('T')[0],
        department: user?.department || 'Computer Engineering',
      })
      .then((res) => {
        setRecords(res.attendance || []);
        setStats(res.stats);
      })
      .finally(() => setIsLoading(false));
  };

  // SheetJS .xlsx Export
  const handleExportExcel = async () => {
    if (records.length === 0) {
      error('No attendance records available to export for this selection.', 'Empty Export');
      return;
    }

    setIsExporting(true);
    try {
      // Prepare clean structured rows for the spreadsheet
      const exportRows = records.map((r, index) => ({
        'Sr. No': index + 1,
        'Student ID': r.studentId,
        'Student Name': r.studentName || r.name || 'Student',
        Department: r.department,
        Year: r.year,
        Division: r.division,
        Subject: r.subject || subject || 'N/A',
        Date: r.date || date,
        Status: (r.status || 'absent').toUpperCase(),
        'Marked At': r.markedAt ? r.markedAt.substring(11, 19) : 'N/A',
      }));

      // Generate worksheet & workbook
      const ws = XLSX.utils.json_to_sheet(exportRows);

      // Auto-size columns for readability
      const colWidths = [
        { wch: 8 },  // Sr
        { wch: 15 }, // ID
        { wch: 25 }, // Name
        { wch: 24 }, // Dept
        { wch: 8 },  // Year
        { wch: 10 }, // Div
        { wch: 20 }, // Subject
        { wch: 14 }, // Date
        { wch: 12 }, // Status
        { wch: 14 }, // Marked At
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Roster');

      const fileName = `SnapPresent_Attendance_${subject || 'Class'}_${date || 'All'}.xlsx`;
      XLSX.writeFile(wb, fileName);

      success(`Exported ${exportRows.length} attendance records to ${fileName}`, 'Excel Downloaded');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to export to Excel';
      error(msg, 'Export Failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#8F76D9] uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Attendance Archives</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
            Attendance Records
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6C86] mt-1 font-body">
            Filter lecture sessions, inspect presence stamps, and export verified records to Excel (.xlsx).
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isExporting || records.length === 0}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-xs sm:text-sm shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 self-start sm:self-auto shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating Excel...' : 'Export to .xlsx'}</span>
        </button>
      </div>

      {/* Stat Cards */}
      {isLoading && !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Class Size */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Roster Count</span>
              <div className="w-7 h-7 rounded-xl bg-[#F4EFFF] flex items-center justify-center text-[#8F76D9]">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
              {stats ? stats.totalStudents : records.length}
            </div>
            <div className="mt-1 text-[11px] text-[#6E6C86] font-mono">Students enrolled</div>
          </div>

          {/* Present Count */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Present</span>
              <div className="w-7 h-7 rounded-xl bg-[#BDEBD6] flex items-center justify-center text-[#1F6B50]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#1F6B50]">
              {stats ? stats.presentToday : records.filter((r) => r.status === 'present').length}
            </div>
            <div className="mt-1 text-[11px] text-[#1F6B50] font-medium">Verified by face scan</div>
          </div>

          {/* Absent Count */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#6E6C86]">Absent</span>
              <div className="w-7 h-7 rounded-xl bg-[#FFC8D6] flex items-center justify-center text-[#8C2F4B]">
                <XCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#8C2F4B]">
              {stats ? stats.absentToday : records.filter((r) => r.status === 'absent').length}
            </div>
            <div className="mt-1 text-[11px] text-[#8C2F4B] font-medium">Unverified / absent</div>
          </div>

          {/* Attendance Rate */}
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
              Ratio for selected session
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#8F76D9] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs font-mono text-[#2B2A3A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Networks"
              className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
            >
              <option value="">All Departments</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="AI & Data Science">AI & Data Science</option>
              <option value="Electronics & Telecommunication">Electronics</option>
              <option value="Mechanical Engineering">Mechanical</option>
              <option value="Civil Engineering">Civil</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-2 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
              >
                <option value="FE">FE</option>
                <option value="SE">SE</option>
                <option value="TE">TE</option>
                <option value="BE">BE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Div</label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-2 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
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
              onClick={handleReset}
              title="Reset"
              className="p-2 rounded-2xl bg-[#F4EFFF] hover:bg-[#E7E0F5] text-[#6E6C86] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Table of Records */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : records.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-[#E7E0F5] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4EFFF] flex items-center justify-center mx-auto text-[#8F76D9]">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-base text-[#2B2A3A]">
            No Attendance Records Found
          </h3>
          <p className="text-xs text-[#6E6C86] max-w-sm mx-auto">
            No live attendance sessions matched your date or class filters. Try adjusting the filters
            or run a live session.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E7E0F5] shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4EFFF] border-b border-[#E7E0F5] text-[#6E6C86] uppercase font-mono tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Student Name / ID</th>
                  <th className="py-3.5 px-5">Subject</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Marked Time</th>
                  <th className="py-3.5 px-5">Class</th>
                  <th className="py-3.5 px-5 text-right">Status Stamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0F5]/60 font-body">
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-[#FBF9FF] transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-sm text-[#2B2A3A]">
                        {r.studentName || r.name || 'Student'}
                      </div>
                      <div className="text-[11px] text-[#6E6C86] font-mono">{r.studentId}</div>
                    </td>
                    <td className="py-4 px-5 text-[#2B2A3A] font-medium">{r.subject || '—'}</td>
                    <td className="py-4 px-5 font-mono text-[#6E6C86]">{r.date}</td>
                    <td className="py-4 px-5 font-mono text-[#6E6C86]">
                      {r.markedAt ? r.markedAt.substring(11, 19) : '—'}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#6E6C86]">
                      {r.year} Div {r.division}
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
            <span>Showing {records.length} records</span>
            <button
              type="button"
              onClick={handleExportExcel}
              className="text-[#8F76D9] hover:underline font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export as .xlsx</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
