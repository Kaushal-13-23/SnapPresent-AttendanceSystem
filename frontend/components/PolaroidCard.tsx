'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { StatusStamp } from './StatusStamp';
import { User } from 'lucide-react';

export interface PolaroidCardProps {
  imageSrc?: string | null;
  name?: string;
  studentId?: string;
  timestamp?: string;
  confidence?: number | null;
  status?: 'present' | 'absent' | 'duplicate' | 'pending';
  rotation?: number;
  caption?: string;
  aspectRatio?: 'square' | 'portrait';
  showTape?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animateIn?: boolean;
  onClick?: () => void;
}

export function PolaroidCard({
  imageSrc,
  name,
  studentId,
  timestamp,
  confidence,
  status = 'present',
  rotation = 0,
  caption,
  aspectRatio = 'square',
  showTape = false,
  className = '',
  size = 'md',
  animateIn = true,
  onClick,
}: PolaroidCardProps) {
  const sizeConfig = {
    sm: {
      cardWidth: 'w-44',
      padding: 'p-2.5 pb-4',
      imgHeight: aspectRatio === 'square' ? 'h-36' : 'h-44',
      nameText: 'text-xs',
      metaText: 'text-[10px]',
    },
    md: {
      cardWidth: 'w-56 sm:w-64',
      padding: 'p-3 pb-5 sm:p-3.5 sm:pb-6',
      imgHeight: aspectRatio === 'square' ? 'h-48 sm:h-52' : 'h-56 sm:h-64',
      nameText: 'text-sm font-semibold',
      metaText: 'text-xs',
    },
    lg: {
      cardWidth: 'w-72 sm:w-80',
      padding: 'p-4 pb-8',
      imgHeight: aspectRatio === 'square' ? 'h-64 sm:h-72' : 'h-72 sm:h-80',
      nameText: 'text-base font-bold',
      metaText: 'text-xs',
    },
  }[size];

  const card = (
    <div
      onClick={onClick}
      className={`relative bg-white border border-[#E7E0F5] rounded-2xl ${sizeConfig.cardWidth} ${sizeConfig.padding} shadow-polaroid hover:shadow-soft transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Decorative Washi Tape */}
      {showTape && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#FFF1B8]/80 backdrop-blur-xs border border-[#E7E0F5]/60 rounded-xs -rotate-2 z-10 shadow-xs pointer-events-none" />
      )}

      {/* Photo Viewport */}
      <div
        className={`relative w-full ${sizeConfig.imgHeight} rounded-xl bg-[#F4EFFF] overflow-hidden border border-[#E7E0F5]/80 flex items-center justify-center`}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={name ? `Snapshot of ${name}` : 'Snapshot photo'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#6E6C86] gap-2 p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E7E0F5] flex items-center justify-center">
              <User className="w-6 h-6 text-[#8F76D9]" />
            </div>
            <span className="text-xs font-mono text-[#6E6C86]">No Image</span>
          </div>
        )}

        {/* Confidence pill in corner */}
        {confidence !== undefined && confidence !== null && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#E7E0F5] text-[10px] font-mono font-semibold text-[#2B2A3A] shadow-xs">
            {confidence.toFixed(1)}% match
          </div>
        )}

        {/* Status Stamp overlay inside photo bottom corner */}
        {status && (
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
            <StatusStamp status={status} size={size === 'sm' ? 'sm' : 'md'} />
          </div>
        )}
      </div>

      {/* Polaroid Caption Area */}
      <div className="mt-3 px-1">
        {name && (
          <div className={`${sizeConfig.nameText} text-[#2B2A3A] truncate font-display`}>
            {name}
          </div>
        )}

        <div className="flex items-center justify-between gap-1 mt-1 font-mono text-[#6E6C86] text-[11px]">
          {studentId && <span className="truncate">{studentId}</span>}
          {timestamp && <span className="text-[10px] opacity-80">{timestamp}</span>}
        </div>

        {caption && (
          <div className="mt-1.5 text-xs text-[#6E6C86] italic line-clamp-2">
            &ldquo;{caption}&rdquo;
          </div>
        )}
      </div>
    </div>
  );

  if (!animateIn) {
    return card;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="inline-block"
    >
      {card}
    </motion.div>
  );
}
