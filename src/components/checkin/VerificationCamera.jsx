import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerificationCamera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('requesting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg('Camera not supported on this device/browser.');
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play().then(() => {
              if (!cancelled) setStatus('ready');
            }).catch(() => {
              if (!cancelled) {
                setStatus('error');
                setErrorMsg('Could not start camera preview. Tap to retry.');
              }
            });
          };
        }
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg('Camera access denied. Enable camera permissions in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMsg('No camera detected on this device.');
        } else if (err.name === 'NotReadableError') {
          setErrorMsg('Camera is in use by another app. Close it and retry.');
        } else {
          setErrorMsg('Could not access camera. Please retry.');
        }
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleRetry = () => {
    setStatus('requesting');
    window.location.reload();
  };

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = (e) => onCapture(e.target.result);
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.92);
  }, [onCapture]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Full-screen camera feed */}
      <div className="absolute inset-0">
        {status !== 'error' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {status === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-white/70 text-sm">Starting camera...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-white text-sm">{errorMsg}</p>
            <button onClick={handleRetry} className="mt-2 text-primary text-sm font-bold">Retry</button>
          </div>
        )}
      </div>

      {/* Cancel button — top left only */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/40 backdrop-blur active:scale-95 transition-transform"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Capture button — bottom center only */}
      {status === 'ready' && (
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-10 flex justify-center">
          <motion.button
            onClick={handleCapture}
            whileTap={{ scale: 0.9 }}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 backdrop-blur shadow-2xl"
          >
            <Camera className="w-8 h-8 text-white" />
          </motion.button>
        </div>
      )}
    </div>
  );
}