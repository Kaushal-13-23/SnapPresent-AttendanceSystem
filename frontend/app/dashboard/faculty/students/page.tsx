'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { api, StudentRecord } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { SkeletonTable } from '@/components/Skeleton';

export default function FacultyStudentsDirectoryPage() {
  const { success, error } = useToast();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [division, setDivision] = useState('');

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Two-Step Delete Modal State
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminStudents({
        search: search || undefined,
        department: department || undefined,
        year: year || undefined,
        division: division || undefined,
      });

      if (res && res.success) {
        setStudents(res.students || []);
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to load students directory';
      error(msg, 'Load Error');
    } finally {
      setIsLoading(false);
    }
  }, [search, department, year, division, error]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('');
    setYear('');
    setDivision('');
    setIsLoading(true);
    api
      .getAdminStudents()
      .then((res) => setStudents(res.students || []))
      .finally(() => setIsLoading(false));
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSavingEdit(true);
    try {
      await api.updateStudent(editingStudent._id, editingStudent);
      success(`Updated record for ${editingStudent.studentName}`, 'Student Updated');
      setEditingStudent(null);
      fetchStudents();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to save student edits';
      error(msg, 'Update Error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Two-Step Delete Execution
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;

    setIsDeleting(true);
    try {
      await api.deleteStudent(deletingStudent._id);
      success(`Deleted student ${deletingStudent.studentName}`, 'Record Removed');
      setDeletingStudent(null);
      fetchStudents();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to delete student';
      error(msg, 'Delete Error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#8F76D9] uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Campus Registry</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
            Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6C86] mt-1 font-body">
            Search, filter, update details, or manage enrolled student records across departments.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-white border border-[#E7E0F5] text-xs font-mono text-[#2B2A3A] shadow-xs self-start sm:self-auto">
          Total Enrolled: <span className="font-bold text-[#8F76D9]">{students.length}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-5 rounded-3xl bg-white border border-[#E7E0F5] shadow-soft-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">
              Search Name, ID or Email
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8F76D9] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A] focus:bg-white focus:border-[#8F76D9]"
              />
            </div>
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

          <div>
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
            >
              <option value="">All Years</option>
              <option value="FE">FE (1st)</option>
              <option value="SE">SE (2nd)</option>
              <option value="TE">TE (3rd)</option>
              <option value="BE">BE (4th)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-xs transition-all shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
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

      {/* Students Table */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : students.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-[#E7E0F5] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4EFFF] flex items-center justify-center mx-auto text-[#8F76D9]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-base text-[#2B2A3A]">
            No Students Found
          </h3>
          <p className="text-xs text-[#6E6C86] max-w-sm mx-auto">
            No enrolled student records match your query. Try broadening your filter parameters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8F76D9] hover:underline pt-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E7E0F5] shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4EFFF] border-b border-[#E7E0F5] text-[#6E6C86] uppercase font-mono tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Student Name / ID</th>
                  <th className="py-3.5 px-5">Department</th>
                  <th className="py-3.5 px-5">Class &amp; Div</th>
                  <th className="py-3.5 px-5">Biometric Face</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0F5]/60 font-body">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-[#FBF9FF] transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-sm text-[#2B2A3A]">
                        {student.studentName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[#6E6C86] font-mono text-[11px]">
                        <span>{student.studentId}</span>
                        <span>&bull;</span>
                        <span className="truncate max-w-[140px] sm:max-w-[200px]">
                          {student.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-[#2B2A3A] font-medium">
                      {student.department}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#6E6C86]">
                      {student.year} &bull; Div {student.division} &bull; Sem {student.semester}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
                          student.face_registered
                            ? 'bg-[#BDEBD6] text-[#1F6B50]'
                            : 'bg-[#FFF1B8] text-[#7A6212]'
                        }`}
                      >
                        {student.face_registered ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Enrolled</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingStudent({ ...student })}
                          aria-label={`Edit ${student.studentName}`}
                          className="p-1.5 rounded-xl hover:bg-[#F4EFFF] text-[#8F76D9] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingStudent(student)}
                          aria-label={`Delete ${student.studentName}`}
                          className="p-1.5 rounded-xl hover:bg-[#FFC8D6] text-[#8C2F4B] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E7E0F5] flex items-center justify-between text-xs text-[#6E6C86] font-mono">
            <span>Showing {students.length} students</span>
            <span>Faculty Admin Access</span>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E7E0F5] shadow-soft-lg p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E0F5] pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-[#2B2A3A]">
                  Edit Student Details
                </h3>
                <p className="text-xs text-[#6E6C86]">Updating records for ID: {editingStudent.studentId}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-full hover:bg-[#F4EFFF] text-[#6E6C86]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.studentName}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, studentName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm text-[#2B2A3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Student ID</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.studentId}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, studentId: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm font-mono text-[#2B2A3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editingStudent.phoneNumber || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, phoneNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs sm:text-sm font-mono text-[#2B2A3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Department</label>
                <select
                  value={editingStudent.department}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, department: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
                >
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Electronics & Telecommunication">Electronics</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                  <option value="Civil Engineering">Civil</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Year</label>
                  <select
                    value={editingStudent.year}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, year: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
                  >
                    <option value="FE">FE</option>
                    <option value="SE">SE</option>
                    <option value="TE">TE</option>
                    <option value="BE">BE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Division</label>
                  <select
                    value={editingStudent.division}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, division: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
                  >
                    <option value="A">Div A</option>
                    <option value="B">Div B</option>
                    <option value="C">Div C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B2A3A] mb-1">Semester</label>
                  <select
                    value={editingStudent.semester}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, semester: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-xs text-[#2B2A3A]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={String(s)}>
                        Sem {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7E0F5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-2xl bg-[#F4EFFF] text-[#2B2A3A] text-xs font-semibold hover:bg-[#E7E0F5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TWO-STEP DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#FFC8D6] shadow-soft-lg p-6 sm:p-7 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFC8D6] text-[#8C2F4B] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-display font-black text-xl text-[#2B2A3A]">
                Confirm Record Deletion
              </h3>
              <p className="text-xs text-[#6E6C86] mt-1.5 leading-relaxed">
                Are you sure you want to delete{' '}
                <strong className="text-[#2B2A3A]">{deletingStudent.studentName}</strong> (
                {deletingStudent.studentId})? This will permanently remove their enrollment and
                512-D face vectors.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4EFFF] border border-[#E7E0F5] text-xs text-[#6E6C86] font-mono text-left space-y-1">
              <div>Dept: {deletingStudent.department}</div>
              <div>Email: {deletingStudent.email}</div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2.5 rounded-2xl bg-[#F4EFFF] text-[#2B2A3A] text-xs font-semibold hover:bg-[#E7E0F5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#FFC8D6] hover:bg-[#F597AF] text-[#8C2F4B] text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
