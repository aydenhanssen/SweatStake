import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, AlertCircle, Loader2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerificationCamera({ challengeCode, onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('requesting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        if (err.name === 'NotAllowedError') {
          setErrorMsg('Camera access denied. Enable camera permissions to verify your workout.');
        } else if (err.name === 'NotFoundError') {
          setErrorMsg('No camera detected on this device.');
        } else {
          setErrorMsg('Could not access camera.');
        }
      }
    }
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = (e) => onCapture(e.target.result);
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.92);
  }, [onCapture]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 z-10">
        <button onClick={onClose} className="p-2 rounded-full bg-black/40 backdrop-blur">
          <X className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-white font-bold text-sm">SweatStake Proof</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 relative overflow-hidden">
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
            <button onClick={onClose} className="mt-2 text-primary text-sm font-bold">Go Back</button>
          </div>
        )}
        {status === 'ready' && (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
      </div>

      {status === 'ready' && (
        <div className="p-4 pb-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur rounded-2xl p-4 mb-6 text-center"
          >
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
              Write this code on paper & hold it visible
            </p>
            <p className="text-primary text-3xl font-black tracking-widest font-mono">
              CODE: {challengeCode}
            </p>
          </motion.div>
          <div className="flex justify-center">
            <motion.button
              onClick={handleCapture}
              whileTap={{ scale: 0.9 }}
              className="w-20 h-20 rounded-full bg-white/10 border-4 border-white flex items-center justify-center backdrop-blur"
            >
              <Camera className="w-8 h-8 text-white" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}