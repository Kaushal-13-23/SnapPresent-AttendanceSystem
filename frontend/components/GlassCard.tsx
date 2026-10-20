'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  gradientBorder?: boolean;
}

export default function GlassCard({
  children,
  className = '',
  onClick,
  hover = true,
  gradientBorder = false,
  ...props
}: GlassCardProps) {
  const baseClasses = 'glass rounded-xl p-6 relative overflow-hidden transition-all duration-300';
  const borderClasses = gradientBorder
    ? 'before:absolute before:inset-0 before:p-[1px] before:bg-gradient-to-r before:from-blue-500/50 before:to-cyan-400/50 before:rounded-xl before:-z-10 before:content-[\'\']'
    : 'border border-slate-700/50';

  return (
    <motion.div
      onClick={onClick}
      whileHover={hover && onClick ? { scale: 1.02, y: -2 } : hover ? { y: -2 } : {}}
      className={`${baseClasses} ${borderClasses} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
