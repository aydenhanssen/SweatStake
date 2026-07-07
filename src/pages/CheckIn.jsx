import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { WORKOUT_TYPES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Check, RotateCcw, ArrowUp, ArrowDown, Heart, Dumbbell, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const workoutIcons = {
  push: ArrowUp,
  pull: ArrowDown,
  legs: Footprints,
  cardio: Heart,
  full_body: Dumbbell,
};

function burnWatermark(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const now = new Date();
      const watermark = `${now.toLocaleDateString()}  ·  ${now.toLocaleTimeString()}`;

      const fontSize = Math.max(14, Math.round(img.width * 0.035));
      ctx.font = `bold ${fontSize}px ui-monospace, monospace`;
      const padding = fontSize * 0.6;
      const textMetrics = ctx.measureText(watermark);
      const boxHeight = fontSize + padding * 2;
      const boxWidth = textMetrics.width + padding * 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(padding, img.height - boxHeight - padding, boxWidth, boxHeight);

      ctx.fillStyle = '#FFD700';
      ctx.textBaseline = 'middle';
      ctx.fillText(watermark, padding * 2, img.height - boxHeight / 2 - padding);

      canvas.toBlob((blob) => {
        resolve({ blob, url: URL.createObjectURL(blob) });
      }, 'image/jpeg', 0.92);
    };
    img.src = dataUrl;
  });
}

export default function CheckInPage() {
  const { profile } = useProfile();
  const [step, setStep] = useState('capture');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [workoutType, setWorkoutType] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [updatedEntry, setUpdatedEntry] = useState(null);
  const [entryLoaded, setEntryLoaded] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile) return;
    async function loadEntry() {
      try {
        const entries = await base44.entities.ChallengeEntry.filter({ user_id: profile.user_id, status: 'active' });
        if (entries.length > 0) setActiveEntry(entries[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setEntryLoaded(true);
      }
    }
    loadEntry();
  }, [profile]);

  useEffect(() => {
    if (entryLoaded && activeEntry && step === 'capture' && fileRef.current && !retaking) {
      fileRef.current.click();
    }
  }, [entryLoaded, activeEntry, step, retaking]);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setRetaking(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const { blob, url } = await burnWatermark(ev.target.result);
      setPhotoFile(blob);
      setPhotoPreview(url);
      setStep('details');
      setRetaking(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRetake = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setStep('capture');
    setRetaking(true);
    setTimeout(() => fileRef.current?.click(), 100);
  };

  const handleSubmit = async () => {
    if (!workoutType || !photoFile || !activeEntry) return;
    setSubmitting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      await base44.entities.CheckIn.create({
        user_id: profile.user_id,
        username: profile.username,
        user_photo_url: profile.photo_url || '',
        challenge_id: activeEntry.challenge_id,
        photo_url: file_url,
        workout_type: workoutType,
        note,
        timestamp: new Date().toISOString(),
      });
      const updated = await base44.entities.ChallengeEntry.update(activeEntry.id, {
        checkins_completed: activeEntry.checkins_completed + 1,
      });
      setUpdatedEntry(updated);
      await base44.entities.UserProfile.update(profile.id, {
        total_workouts: profile.total_workouts + 1,
        current_streak: profile.current_streak + 1,
        longest_streak: Math.max(profile.longest_streak, profile.current_streak + 1),
      });
      setStep('success');
    } catch (err) {
      toast({ title: 'Error', description: 'Check-in failed. Try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile || !entryLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const progressEntry = updatedEntry || activeEntry;
  const progressPct = progressEntry
    ? Math.min(100, (progressEntry.checkins_completed / progressEntry.checkins_required) * 100)
    : 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 min-h-screen flex flex-col">
      <h1 className="text-xl font-black mb-6">Check In</h1>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />

      <AnimatePresence mode="wait">
        {step === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6"
          >
            {!activeEntry ? (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Join a challenge first to check in</p>
                <Button onClick={() => navigate('/challenges')} className="font-bold rounded-2xl">
                  Browse Challenges
                </Button>
              </div>
            ) : (
              <>
                <motion.button
                  onClick={() => fileRef.current?.click()}
                  whileTap={{ scale: 0.95 }}
                  className="w-36 h-36 rounded-full bg-primary/10 border-4 border-primary/30 flex items-center justify-center transition-all hover:bg-primary/20 hover:border-primary/50"
                >
                  <Camera className="w-14 h-14 text-primary" />
                </motion.button>
                <div className="text-center">
                  <p className="font-bold text-foreground">Opening Camera...</p>
                  <p className="text-sm text-muted-foreground">Tap if your camera doesn't open automatically</p>
                </div>
              </>
            )}
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col gap-5"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-square bg-card">
              <img src={photoPreview} alt="Workout proof" className="w-full h-full object-cover" />
              <button
                onClick={handleRetake}
                className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur rounded-full"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            </div>

            <div>
              <p className="text-sm font-bold text-foreground mb-3">Workout Type</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(WORKOUT_TYPES).map(([key, { label }]) => {
                  const Icon = workoutIcons[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setWorkoutType(key)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border transition-all text-sm font-semibold ${
                        workoutType === key
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-foreground mb-2">Note <span className="font-normal text-muted-foreground">(optional)</span></p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="How was your workout?"
                className="bg-card border-border resize-none rounded-2xl"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!workoutType || submitting}
              className="h-14 text-lg font-black rounded-2xl mt-auto"
            >
              {submitting ? 'Submitting...' : 'Submit Check In'}
            </Button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
              className="relative w-28 h-28 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-primary/10 border-2 border-primary/40" />
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
              >
                <Check className="w-14 h-14 text-primary" strokeWidth={3} />
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-primary"
              />
            </motion.div>

            <div>
              <h2 className="text-2xl font-black text-foreground">Check In Submitted</h2>
              <p className="text-muted-foreground mt-2">Great work — keep the streak alive!</p>
            </div>

            {progressEntry && (
              <div className="w-full max-w-xs bg-card border border-border rounded-2xl p-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Challenge Progress</span>
                  <span className="font-bold text-primary">{progressEntry.checkins_completed}/{progressEntry.checkins_required}</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-yellow-300 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {progressEntry.checkins_required - progressEntry.checkins_completed > 0
                    ? `${progressEntry.checkins_required - progressEntry.checkins_completed} check-in${progressEntry.checkins_required - progressEntry.checkins_completed > 1 ? 's' : ''} to go!`
                    : 'Challenge complete! 🎉'}
                </p>
              </div>
            )}

            <Button onClick={() => navigate('/')} className="font-bold rounded-2xl px-8 mt-2">
              Back to Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}