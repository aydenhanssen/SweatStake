import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { WORKOUT_TYPES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Check, RotateCcw, ArrowUp, ArrowDown, Heart, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const workoutIcons = {
  push: ArrowUp,
  pull: ArrowDown,
  legs: Dumbbell,
  cardio: Heart,
  full_body: Dumbbell,
};

export default function CheckInPage() {
  const { profile } = useProfile();
  const [step, setStep] = useState('capture'); // capture, details, success
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [workoutType, setWorkoutType] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile) return;
    async function loadEntry() {
      const entries = await base44.entities.ChallengeEntry.filter({ user_id: profile.user_id, status: 'active' });
      if (entries.length > 0) setActiveEntry(entries[0]);
    }
    loadEntry();
  }, [profile]);

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    if (!workoutType || !photoFile || !activeEntry) return;
    setSubmitting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      await base44.entities.CheckIn.create({
        user_id: profile.user_id,
        username: profile.username,
        challenge_id: activeEntry.challenge_id,
        photo_url: file_url,
        workout_type: workoutType,
        note,
        timestamp: new Date().toISOString(),
      });
      await base44.entities.ChallengeEntry.update(activeEntry.id, {
        checkins_completed: activeEntry.checkins_completed + 1,
      });
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 min-h-screen flex flex-col">
      <h1 className="text-xl font-black mb-6">Check In</h1>

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
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-36 h-36 rounded-full bg-primary/10 border-4 border-primary/30 flex items-center justify-center transition-all hover:bg-primary/20 hover:border-primary/50 active:scale-95"
                >
                  <Camera className="w-14 h-14 text-primary" />
                </button>
                <div className="text-center">
                  <p className="font-bold text-foreground">Take Your Proof</p>
                  <p className="text-sm text-muted-foreground">Snap a photo of your workout</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleCapture}
                />
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
            {/* Photo Preview */}
            <div className="relative rounded-3xl overflow-hidden aspect-square bg-card">
              <img src={photoPreview} alt="Workout" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur px-3 py-1.5 rounded-xl">
                <p className="text-xs font-mono text-white">{new Date().toLocaleString()}</p>
              </div>
              <button
                onClick={() => { setStep('capture'); setPhotoFile(null); setPhotoPreview(null); }}
                className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur rounded-full"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Workout Type */}
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

            {/* Note */}
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
              className="h-14 text-lg font-black rounded-2xl mt-auto mb-4"
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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center"
            >
              <Check className="w-12 h-12 text-green-500" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Check In Complete!</h2>
              <p className="text-muted-foreground mt-2">Keep the momentum going 💪</p>
            </div>
            {activeEntry && (
              <p className="text-sm text-muted-foreground">
                Progress: <span className="font-bold text-primary">{activeEntry.checkins_completed + 1}/{activeEntry.checkins_required}</span>
              </p>
            )}
            <Button onClick={() => navigate('/')} className="font-bold rounded-2xl px-8">
              Back to Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}