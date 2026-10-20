'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ViewfinderProps {
  children: React.ReactNode;
  isScanning?: boolean;
  shutterFlash?: boolean;
  cornerSize?: number;
  roundedRadius?: string;
  className?: string;
  title?: string;
  badge?: string;
}

export function Viewfinder({
  children,
  isScanning = false,
  shutterFlash = false,
  cornerSize = 32,
  roundedRadius = 'rounded-2xl',
  className = '',
  title,
  badge,
}: ViewfinderProps) {
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    if (shutterFlash) {
      setFlashActive(true);
      const timer = setTimeout(() => {
        setFlashActive(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [shutterFlash]);

  return (
    <div
      className={`relative overflow-hidden bg-[#2B2A3A] ${roundedRadius} border-2 border-[#E7E0F5] shadow-soft-lg select-none ${className}`}
    >
      {/* Media Content (Webcam / Canvas) */}
      <div className="relative w-full h-full flex items-center justify-center">
        {children}
      </div>

      {/* Viewfinder Target Framing Brackets (lilac-deep #8F76D9) */}
      <div className="absolute inset-4 sm:inset-6 pointer-events-none z-10 transition-all duration-300">
        {/* Top-Left Bracket */}
        <div
          className="absolute top-0 left-0 border-t-4 border-l-4 border-[#8F76D9] rounded-tl-xl drop-shadow-sm"
          style={{ width: cornerSize, height: cornerSize }}
        />
        {/* Top-Right Bracket */}
        <div
          className="absolute top-0 right-0 border-t-4 border-r-4 border-[#8F76D9] rounded-tr-xl drop-shadow-sm"
          style={{ width: cornerSize, height: cornerSize }}
        />
        {/* Bottom-Left Bracket */}
        <div
          className="absolute bottom-0 left-0 border-b-4 border-l-4 border-[#8F76D9] rounded-bl-xl drop-shadow-sm"
          style={{ width: cornerSize, height: cornerSize }}
        />
        {/* Bottom-Right Bracket */}
        <div
          className="absolute bottom-0 right-0 border-b-4 border-r-4 border-[#8F76D9] rounded-br-xl drop-shadow-sm"
          style={{ width: cornerSize, height: cornerSize }}
        />

        {/* Center Crosshair Target */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <div className="w-10 h-10 border border-[#C9B6F2] rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#8F76D9]" />
          </div>
        </div>
      </div>

      {/* Gentle Sweeping Scan Line when live scanning */}
      {isScanning && (
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C9B6F2] to-transparent shadow-[0_0_12px_#8F76D9] pointer-events-none z-20 animate-scan-line" />
      )}

      {/* Shutter Flash Animation Overlay */}
      <AnimatePresence>
        {flashActive && (
          <motion.div
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            className="absolute inset-0 bg-white z-30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Header Info Overlay */}
      {(title || badge) && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
          {title && (
            <div className="bg-[#2B2A3A]/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/10 shadow-xs">
              {title}
            </div>
          )}
          {badge && (
            <div className="bg-[#8F76D9] text-white px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#BDEBD6] animate-pulse" />
              {badge}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
