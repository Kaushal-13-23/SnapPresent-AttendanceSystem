'use client';

import React, { useEffect, useState } from 'react';
import { animate, useMotionValue, useTransform, motion } from 'framer-motion';

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function AnimatedCounter({ 
  target, 
  duration = 2, 
  prefix = '', 
  suffix = '', 
  className = '' 
}: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, target, { duration });
    
    // update state so it renders gracefully
    const unsubscribe = rounded.on("change", (v) => {
      setDisplayValue(v.toString());
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [target, duration, count, rounded]);

  return (
    <span className={`font-mono font-bold ${className}`}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
}
