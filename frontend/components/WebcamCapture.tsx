'use client';

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { CameraOff, RefreshCw } from 'lucide-react';
import { Viewfinder } from './Viewfinder';

export interface WebcamCaptureHandle {
  captureFrame: () => string | null;
  startLiveSampling: (onSample: (base64: string) => Promise<void>) => void;
  stopLiveSampling: () => void;
  isStreaming: boolean;
}

export interface WebcamCaptureProps {
  onCapture?: (base64Image: string) => void;
  isScanning?: boolean;
  shutterFlash?: boolean;
  className?: string;
  title?: string;
  badge?: string;
  mirrored?: boolean;
  sampleIntervalMs?: number; // default ~2000ms
  autoStart?: boolean;
}

export const WebcamCapture = forwardRef<WebcamCaptureHandle, WebcamCaptureProps>(function WebcamCapture(
  {
    onCapture,
    isScanning = false,
    shutterFlash = false,
    className = '',
    title,
    badge,
    mirrored = true,
    sampleIntervalMs = 2000,
    autoStart = true,
  },
  ref
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [internalFlash, setInternalFlash] = useState<boolean>(false);

  const isSamplingRef = useRef<boolean>(false);
  const isRequestInFlightRef = useRef<boolean>(false);
  const samplingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop video stream cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    stopStream();

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setIsLoading(false);
          setHasPermission(true);
        };
      }
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      console.error('Webcam access error:', err);
      setIsLoading(false);
      setHasPermission(false);

      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera access was denied. Please allow camera permissions in your browser address bar and refresh.'
        );
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device detected. Please connect a webcam to continue.');
      } else {
        setErrorMessage(error?.message || 'Unable to access camera. Please check system permissions.');
      }
    }
  }, [stopStream]);

  // Capture frame as JPEG base64 string
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      return null;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (mirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // High quality JPEG base64 output
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Trigger local shutter flash
    setInternalFlash(true);
    setTimeout(() => setInternalFlash(false), 350);

    if (onCapture) {
      onCapture(dataUrl);
    }

    return dataUrl;
  }, [mirrored, onCapture]);

  // Stop live interval sampling
  const stopLiveSampling = useCallback(() => {
    isSamplingRef.current = false;
    if (samplingTimerRef.current) {
      clearInterval(samplingTimerRef.current);
      samplingTimerRef.current = null;
    }
  }, []);

  // Start live interval sampling (~2s), dropping frames if previous is still in-flight
  const startLiveSampling = useCallback(
    (onSample: (base64: string) => Promise<void>) => {
      stopLiveSampling();
      isSamplingRef.current = true;

      const runSampleTick = async () => {
        if (!isSamplingRef.current) return;
        // Drop frame if request is still pending
        if (isRequestInFlightRef.current) {
          return;
        }

        const frameBase64 = captureFrame();
        if (!frameBase64) return;

        isRequestInFlightRef.current = true;
        try {
          await onSample(frameBase64);
        } catch (e) {
          console.error('Sample processing error:', e);
        } finally {
          isRequestInFlightRef.current = false;
        }
      };

      // Initial tick right away, then interval
      runSampleTick();
      samplingTimerRef.current = setInterval(runSampleTick, sampleIntervalMs);
    },
    [captureFrame, sampleIntervalMs, stopLiveSampling]
  );

  // Expose imperative methods to parent components
  useImperativeHandle(
    ref,
    () => ({
      captureFrame,
      startLiveSampling,
      stopLiveSampling,
      isStreaming: !!hasPermission && !isLoading,
    }),
    [captureFrame, startLiveSampling, stopLiveSampling, hasPermission, isLoading]
  );

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopLiveSampling();
      stopStream();
    };
  }, [autoStart, startCamera, stopLiveSampling, stopStream]);

  return (
    <div className={`relative ${className}`}>
      <Viewfinder
        isScanning={isScanning}
        shutterFlash={shutterFlash || internalFlash}
        title={title}
        badge={badge}
        className="w-full aspect-[4/3] max-h-[480px]"
      >
        {/* Hidden video element feeding into viewfinder */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${mirrored ? '-scale-x-100' : ''}`}
        />

        {/* Hidden canvas for taking snapshot JPEG */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#2B2A3A] flex flex-col items-center justify-center text-white gap-3 z-20">
            <RefreshCw className="w-8 h-8 text-[#C9B6F2] animate-spin" />
            <p className="text-xs text-[#E7E0F5] font-medium tracking-wide">Initializing Camera Feed...</p>
          </div>
        )}

        {/* Permission Denied or Error State */}
        {hasPermission === false && !isLoading && (
          <div className="absolute inset-0 bg-[#2B2A3A] p-6 flex flex-col items-center justify-center text-center text-white z-20">
            <div className="w-14 h-14 rounded-2xl bg-[#FFC8D6]/20 border border-[#FFC8D6]/40 flex items-center justify-center mb-3">
              <CameraOff className="w-7 h-7 text-[#FFC8D6]" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5 font-display">Camera Unavailable</h3>
            <p className="text-xs text-[#E7E0F5]/80 max-w-xs mb-4 leading-relaxed font-body">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9B6F2] text-[#2B2A3A] text-xs font-semibold hover:bg-[#8F76D9] hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}
      </Viewfinder>
    </div>
  );
});
