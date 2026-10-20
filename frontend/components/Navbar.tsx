'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Sparkles, LayoutDashboard, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const { user, isAuthenticated } = useAuth();

  const dashboardHref =
    user?.userType === 'teacher' ? '/dashboard/faculty' : '/dashboard/student';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF9FF]/85 backdrop-blur-md border-b border-[#E7E0F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-[#C9B6F2] border border-[#8F76D9]/30 flex items-center justify-center shadow-soft-sm group-hover:rotate-6 transition-transform">
            <Camera className="w-5 h-5 text-[#2B2A3A]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-xl tracking-tight text-[#2B2A3A]">
                SnapPresent
              </span>
              <span className="w-2 h-2 rounded-full bg-[#BDEBD6]" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#6E6C86] block -mt-1">
              Soft Snapshot Attendance
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6E6C86]">
          <a href="#how-it-works" className="hover:text-[#2B2A3A] transition-colors">
            How It Works
          </a>
          <a href="#for-students" className="hover:text-[#2B2A3A] transition-colors">
            For Students
          </a>
          <a href="#for-faculty" className="hover:text-[#2B2A3A] transition-colors">
            For Faculty
          </a>
          <a href="#privacy" className="hover:text-[#2B2A3A] transition-colors">
            Privacy & Trust
          </a>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-medium text-sm shadow-soft-sm transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/signin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-medium text-[#2B2A3A] hover:bg-[#F4EFFF] transition-colors"
              >
                <LogIn className="w-4 h-4 text-[#8F76D9]" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-sm shadow-soft-sm hover:shadow-soft transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
