'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { api } from '@/lib/api';
import { SkeletonCard } from '@/components/Skeleton';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [recordId, setRecordId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('TE');
  const [division, setDivision] = useState('A');
  const [semester, setSemester] = useState('5');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [faceRegistered, setFaceRegistered] = useState<boolean>(false);

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const response = await api.getOwnStudentRecords();
        if (response.students && response.students.length > 0) {
          const s = response.students[0];
          setRecordId(s._id);
          setStudentName(s.studentName || '');
          setStudentId(s.studentId || '');
          setDepartment(s.department || '');
          setYear(s.year || 'TE');
          setDivision(s.division || 'A');
          setSemester(s.semester || '5');
          setPhoneNumber(s.phoneNumber || '');
          setEmail(s.email || user?.email || '');
          setFaceRegistered(!!s.face_registered);
        } else {
          setEmail(user?.email || '');
          setStudentName(user?.username || '');
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordId) {
      error('No student record found to update. Complete face registration first.', 'Profile Error');
      return;
    }

    setIsSaving(true);
    try {
      await api.updateStudent(recordId, {
        studentName,
        studentId,
        department,
        year,
        division,
        semester,
        phoneNumber,
      });
      success('Student details updated successfully!', 'Profile Saved');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to update student profile.';
      error(msg, 'Update Error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#8F76D9] uppercase tracking-wider mb-1">
          <User className="w-3.5 h-3.5" />
          <span>Student Account</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
          Profile &amp; Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6C86] mt-1 font-body">
          Manage your enrolled academic metadata. Note that your registered email is locked for security.
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <div className="space-y-6">
          {/* Biometrics Status Banner */}
          <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  faceRegistered
                    ? 'bg-[#BDEBD6] text-[#1F6B50]'
                    : 'bg-[#FFF1B8] text-[#7A6212]'
                }`}
              >
                {faceRegistered ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-display font-bold text-sm text-[#2B2A3A]">
                  Biometric Face Embeddings: {faceRegistered ? 'Active & Ready' : 'Pending Enrollment'}
                </div>
                <div className="text-xs text-[#6E6C86]">
                  {faceRegistered
                    ? '512-dimensional Facenet vectors stored in MongoDB.'
                    : 'You have not enrolled your 5 facial angles yet.'}
                </div>
              </div>
            </div>

            {!faceRegistered && (
              <a
                href="/dashboard/student/register"
                className="px-3.5 py-1.5 rounded-xl bg-[#C9B6F2] text-[#2B2A3A] font-semibold text-xs shadow-xs hover:bg-[#8F76D9] hover:text-white transition-all shrink-0"
              >
                Enroll Face
              </a>
            )}
          </div>

          {/* Edit Form */}
          <form
            onSubmit={handleSave}
            className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
                  Student Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8F76D9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-sm text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
                  Student ID / Roll No.
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-sm font-mono text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9]"
                />
              </div>
            </div>

            {/* Email (Locked per contract) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#2B2A3A]">
                  University Email
                </label>
                <span className="text-[10px] font-mono text-[#6E6C86] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#8F76D9]" />
                  Locked for verification security
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6E6C86] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#E7E0F5]/50 border border-[#E7E0F5] text-sm text-[#6E6C86] cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8F76D9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-sm font-mono text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-sm text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9]"
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-sm text-[#2B2A3A]"
                >
                  <option value="FE">FE</option>
                  <option value="SE">SE</option>
                  <option value="TE">TE</option>
                  <option value="BE">BE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">Division</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-sm text-[#2B2A3A]"
                >
                  <option value="A">Div A</option>
                  <option value="B">Div B</option>
                  <option value="C">Div C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-sm text-[#2B2A3A]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={String(s)}>
                      Sem {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E0F5] flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-sm shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
