'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
  rounded?: string;
}

export function Skeleton({ className = '', rounded = 'rounded-xl' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-[#F4EFFF] border border-[#E7E0F5]/60 ${rounded} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-5 rounded-2xl bg-white border border-[#E7E0F5] shadow-soft-sm ${className}`}>
      <Skeleton className="h-6 w-1/3 mb-4 rounded-lg" />
      <Skeleton className="h-10 w-2/3 mb-3 rounded-lg" />
      <Skeleton className="h-4 w-full rounded-md" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-[#E7E0F5] overflow-hidden shadow-soft-sm p-4">
      <div className="flex gap-4 pb-3 border-b border-[#E7E0F5]">
        <Skeleton className="h-4 w-1/4 rounded-md" />
        <Skeleton className="h-4 w-1/4 rounded-md" />
        <Skeleton className="h-4 w-1/4 rounded-md" />
        <Skeleton className="h-4 w-1/4 rounded-md" />
      </div>
      <div className="divide-y divide-[#E7E0F5]/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="py-3.5 flex gap-4 items-center">
            <Skeleton className="h-4 w-1/4 rounded-md" />
            <Skeleton className="h-4 w-1/4 rounded-md" />
            <Skeleton className="h-4 w-1/4 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
