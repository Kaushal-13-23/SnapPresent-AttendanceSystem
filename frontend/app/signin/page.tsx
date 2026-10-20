'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Mail, Lock, ArrowRight, GraduationCap, School } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { UserType } from '@/lib/api';

export default function SignInPage() {
  const [userType, setUserType] = useState<UserType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ email, password, userType });
      success(`Welcome back, ${loggedInUser.username || 'User'}!`, 'Signed In');
      const target =
        loggedInUser.userType === 'teacher' ? '/dashboard/faculty' : '/dashboard/student';
      router.push(target);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Invalid email or password.';
      setErrorMessage(msg);
      error(msg, 'Sign In Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9FF] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Blurred decorative ambient blobs */}
      <div className="absolute top-10 left-1/3 w-80 h-80 bg-[#C9B6F2]/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/3 w-72 h-72 bg-[#FFD3BD]/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Brand header */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-11 h-11 rounded-2xl bg-[#C9B6F2] border border-[#8F76D9]/30 flex items-center justify-center shadow-soft-sm group-hover:rotate-6 transition-transform">
          <Camera className="w-5 h-5 text-[#2B2A3A]" />
        </div>
        <div>
          <span className="font-display font-black text-2xl text-[#2B2A3A] tracking-tight block">
            SnapPresent
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#6E6C86]">
            Soft Snapshot Access
          </span>
        </div>
      </Link>

      {/* Main Sign In Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white border border-[#E7E0F5] rounded-3xl p-6 sm:p-8 shadow-soft"
      >
        <div className="text-center mb-6">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#2B2A3A]">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6C86] mt-1 font-body">
            Choose your role and enter your account credentials
          </p>
        </div>

        {/* Student / Faculty Toggle with Animated Sliding Pill */}
        <div className="relative bg-[#F4EFFF] p-1.5 rounded-2xl border border-[#E7E0F5] flex mb-6">
          <button
            type="button"
            onClick={() => setUserType('student')}
            className={`relative flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 z-10 transition-colors ${
              userType === 'student' ? 'text-[#2B2A3A]' : 'text-[#6E6C86] hover:text-[#2B2A3A]'
            }`}
          >
            {userType === 'student' && (
              <motion.div
                layoutId="auth-role-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-white rounded-xl shadow-soft-sm border border-[#E7E0F5]"
              />
            )}
            <GraduationCap className="w-4 h-4 z-10" />
            <span className="z-10">Student</span>
          </button>

          <button
            type="button"
            onClick={() => setUserType('teacher')}
            className={`relative flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 z-10 transition-colors ${
              userType === 'teacher' ? 'text-[#2B2A3A]' : 'text-[#6E6C86] hover:text-[#2B2A3A]'
            }`}
          >
            {userType === 'teacher' && (
              <motion.div
                layoutId="auth-role-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-white rounded-xl shadow-soft-sm border border-[#E7E0F5]"
              />
            )}
            <School className="w-4 h-4 z-10" />
            <span className="z-10">Faculty / Teacher</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-2xl bg-[#FFC8D6] border border-[#F2B3C3] text-[#8C2F4B] text-xs font-medium flex items-center gap-2">
            <span>&bull;</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8F76D9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  userType === 'teacher' ? 'faculty@university.edu' : 'student@university.edu'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-sm text-[#2B2A3A] placeholder-[#6E6C86]/60 focus:bg-white focus:border-[#8F76D9] focus-visible:ring-2 focus-visible:ring-[#8F76D9] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2A3A] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8F76D9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4EFFF]/60 border border-[#E7E0F5] text-sm text-[#2B2A3A] placeholder-[#6E6C86]/60 focus:bg-white focus:border-[#8F76D9] focus-visible:ring-2 focus-visible:ring-[#8F76D9] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#C9B6F2] hover:bg-[#8F76D9] text-[#2B2A3A] hover:text-white font-semibold text-sm shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </span>
            ) : (
              <>
                <span>Sign in as {userType === 'teacher' ? 'Faculty' : 'Student'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 pt-5 border-t border-[#E7E0F5] text-center text-xs text-[#6E6C86]">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/signup"
            className="font-bold text-[#8F76D9] hover:text-[#2B2A3A] transition-colors"
          >
            Create an account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
