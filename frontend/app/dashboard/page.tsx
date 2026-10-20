'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardIndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/signin');
      } else if (user.userType === 'teacher') {
        router.replace('/dashboard/faculty');
      } else {
        router.replace('/dashboard/student');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-3 border-[#8F76D9] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
