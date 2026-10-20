'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Camera,
  LayoutDashboard,
  CalendarCheck2,
  User,
  Users,
  Video,
  FileSpreadsheet,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export interface DashboardShellProps {
  children: React.ReactNode;
  allowedRole?: 'student' | 'teacher';
}

export function DashboardShell({ children, allowedRole }: DashboardShellProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { success } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && user && allowedRole && user.userType !== allowedRole) {
      const correctPath =
        user.userType === 'teacher' ? '/dashboard/faculty' : '/dashboard/student';
      router.replace(correctPath);
    }
  }, [isLoading, user, allowedRole, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#FBF9FF] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#C9B6F2] flex items-center justify-center animate-bounce shadow-soft">
          <Camera className="w-6 h-6 text-[#2B2A3A]" />
        </div>
        <p className="text-sm font-medium text-[#6E6C86]">Loading SnapPresent workspace...</p>
      </div>
    );
  }

  const isTeacher = user.userType === 'teacher';

  // Navigation Items
  const studentNav = [
    { label: 'Overview', href: '/dashboard/student', icon: LayoutDashboard },
    { label: 'Register Face', href: '/dashboard/student/register', icon: Camera },
    { label: 'My Attendance', href: '/dashboard/student/attendance', icon: CalendarCheck2 },
    { label: 'Profile', href: '/dashboard/student/profile', icon: User },
  ];

  const facultyNav = [
    { label: 'Overview', href: '/dashboard/faculty', icon: LayoutDashboard },
    { label: 'Live Session', href: '/dashboard/faculty/session', icon: Video },
    { label: 'Students', href: '/dashboard/faculty/students', icon: Users },
    { label: 'Attendance Records', href: '/dashboard/faculty/records', icon: FileSpreadsheet },
  ];

  const navItems = isTeacher ? facultyNav : studentNav;

  const handleLogout = async () => {
    await logout();
    success('You have been logged out safely.', 'Signed Out');
  };

  return (
    <div className="min-h-screen bg-[#FBF9FF] flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Left Sidebar (width 260px) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#E7E0F5] shrink-0 sticky top-0 h-screen p-5 justify-between shadow-soft-sm z-30">
        <div>
          {/* Brand Header */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 group px-1">
            <div className="w-10 h-10 rounded-2xl bg-[#C9B6F2] border border-[#8F76D9]/30 flex items-center justify-center shadow-soft-sm group-hover:rotate-6 transition-transform">
              <Camera className="w-5 h-5 text-[#2B2A3A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg text-[#2B2A3A]">
                  SnapPresent
                </span>
                <span className="w-2 h-2 rounded-full bg-[#BDEBD6]" />
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#6E6C86]">
                {isTeacher ? 'Faculty Portal' : 'Student Portal'}
              </span>
            </div>
          </Link>

          {/* User Profile Capsule */}
          <div className="p-3.5 rounded-2xl bg-[#F4EFFF] border border-[#E7E0F5] mb-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C9B6F2] text-[#2B2A3A] font-display font-bold flex items-center justify-center shrink-0">
                {(user.username || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-sm text-[#2B2A3A] truncate">
                  {user.username || user.studentName || 'Authenticated User'}
                </div>
                <div className="text-xs text-[#6E6C86] truncate font-mono">
                  {user.studentId || user.employeeId || user.email}
                </div>
              </div>
            </div>
            {user.department && (
              <div className="mt-2 pt-2 border-t border-[#E7E0F5]/80 flex items-center justify-between text-[11px] text-[#6E6C86]">
                <span>Dept</span>
                <span className="font-medium text-[#2B2A3A]">{user.department}</span>
              </div>
            )}
          </div>

          {/* Main Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#C9B6F2] text-[#2B2A3A] font-semibold shadow-soft-sm'
                      : 'text-[#6E6C86] hover:bg-[#F4EFFF] hover:text-[#2B2A3A]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#2B2A3A]' : 'text-[#8F76D9]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Mode switch & Logout */}
        <div className="space-y-2 pt-4 border-t border-[#E7E0F5]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-[#8C2F4B] hover:bg-[#FFC8D6]/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-[#FBF9FF]/95 backdrop-blur-md border-b border-[#E7E0F5] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#C9B6F2] flex items-center justify-center">
            <Camera className="w-4 h-4 text-[#2B2A3A]" />
          </div>
          <span className="font-display font-black text-base text-[#2B2A3A]">
            SnapPresent
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4EFFF] text-[#6E6C86] font-mono border border-[#E7E0F5]">
            {isTeacher ? 'Faculty' : 'Student'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="p-1.5 rounded-xl hover:bg-[#FFC8D6]/40 text-[#8C2F4B]"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E7E0F5] px-2 py-1.5 flex items-center justify-around z-40 shadow-soft-lg"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#2B2A3A] font-bold'
                  : 'text-[#6E6C86] hover:text-[#2B2A3A]'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  isActive ? 'bg-[#C9B6F2]' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
