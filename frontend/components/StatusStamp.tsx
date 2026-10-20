'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface StatusStampProps {
  status: 'present' | 'absent' | 'duplicate' | 'pending';
  size?: 'sm' | 'md' | 'lg';
  rotation?: number;
  className?: string;
  animate?: boolean;
}

export function StatusStamp({
  status,
  size = 'md',
  rotation = status === 'present' ? -6 : 6,
  className = '',
  animate = true,
}: StatusStampProps) {
  // Styles based on status using exact WCAG AA Tokens:
  // Present: Mint fill (#BDEBD6) with mint-ink (#1F6B50)
  // Absent: Rose fill (#FFC8D6) with rose-ink (#8C2F4B)
  // Duplicate: Peach fill (#FFD3BD) with peach-ink (#8A4A2B)
  // Pending: Butter fill (#FFF1B8) with butter-ink (#7A6212)
  let bg = 'bg-[#BDEBD6]';
  let text = 'text-[#1F6B50]';
  let border = 'border-[#1F6B50]';
  let label = 'PRESENT';

  if (status === 'absent') {
    bg = 'bg-[#FFC8D6]';
    text = 'text-[#8C2F4B]';
    border = 'border-[#8C2F4B]';
    label = 'ABSENT';
  } else if (status === 'duplicate') {
    bg = 'bg-[#FFD3BD]';
    text = 'text-[#8A4A2B]';
    border = 'border-[#8A4A2B]';
    label = 'RECORDED';
  } else if (status === 'pending') {
    bg = 'bg-[#FFF1B8]';
    text = 'text-[#7A6212]';
    border = 'border-[#7A6212]';
    label = 'PENDING';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 border-1.5 font-bold tracking-widest',
    md: 'text-xs px-2.5 py-1 border-2 font-black tracking-wider',
    lg: 'text-sm px-3.5 py-1.5 border-2 font-black tracking-widest',
  }[size];

  const content = (
    <span
      className={`inline-flex items-center justify-center uppercase rounded-lg border-dashed select-none shadow-xs font-mono ${bg} ${text} ${border} ${sizeClasses} ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {label}
    </span>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ scale: 1.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      className="inline-block"
    >
      {content}
    </motion.div>
  );
}
