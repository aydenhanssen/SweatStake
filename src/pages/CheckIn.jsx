import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { WORKOUT_TYPES, GOALS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, RotateCcw, ArrowUp, ArrowDown, Heart, Dumbbell, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import VerificationCamera from '@/components/checkin/VerificationCamera';
import { burnWatermark } from '@/components/checkin/burnWatermark';

const workoutIcons = {
  push: ArrowUp,
  pull: ArrowDown,
  legs: Footprints,
  cardio: Heart,
  full_body: Dumbbell,
};

export default function CheckInPage() {
  const { profile, refetch } = useProfile();
  const [step, setStep] = useState('camera');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [captureTimestamp, setCaptureTimestamp] = useState(null);
  const [workoutType, setWorkoutType] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [updatedEntry, setUpdatedEntry] = useState(null);
  const [entryLoaded, setEntryLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const goalName = profile ? (GOALS[profile.primary_goal] || profile.primary_goal || '') : '';

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

  const handleCameraCapture = async (rawDataUrl) => {
    const result = await burnWatermark(rawDataUrl, goalName);
    if (!result) {
      toast({ title: 'Error', description: 'Could not process photo. Try again.', variant: 'destructive' });
      return;
    }
    setPhotoFile(result.file);
    setPhotoPreview(result.url);
    setCaptureTimestamp(result.timestamp);
    setStep('preview');
  };

  const handleRetake = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setCaptureTimestamp(null);
    setStep('camera');
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
        timestamp: captureTimestamp,
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
      await refetch();
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

      <AnimatePresence mode="wait">
        {step === 'camera' && (
          activeEntry ? (
            <VerificationCamera
              onCapture={handleCameraCapture}
              onClose={() => navigate('/')}
            />
          ) : (
            <motion.div
              key="no-entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
            >
              <p className="text-muted-foreground">Join a challenge first to check in</p>
              <Button onClick={() => navigate('/challenges')} className="font-bold rounded-2xl">
                Browse Challenges
              </Button>
            </motion.div>
          )
        )}

        {step === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col gap-5"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-square bg-card">
              <img src={photoPreview} alt="Workout proof" className="w-full h-full object-cover" />
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

            <div className="flex gap-3 mt-auto pb-2">
              <Button
                onClick={handleRetake}
                variant="outline"
                className="h-14 flex-1 text-base font-bold rounded-2xl"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!workoutType || submitting}
                className="h-14 flex-1 text-base font-black rounded-2xl"
              >
                <Check className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit Proof'}
              </Button>
            </div>
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
              <Check className="w-14 h-14 text-primary" strokeWidth={3} />
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