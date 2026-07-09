import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Dumbbell, TrendingUp, Camera } from 'lucide-react';
import { GOALS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Just getting started' },
  { value: 'intermediate', label: 'Intermediate', desc: '6+ months training' },
  { value: 'advanced', label: 'Advanced', desc: '2+ years training' },
];

const GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Lose Weight', icon: TrendingUp },
  { value: 'build_muscle', label: 'Build Muscle', icon: Dumbbell },
  { value: 'stay_consistent', label: 'Stay Consistent', icon: Target },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      let photo_url = '';
      if (photoFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
        photo_url = file_url;
      }
      await base44.entities.UserProfile.create({
        user_id: me.id,
        username,
        photo_url,
        fitness_level: fitnessLevel,
        primary_goal: primaryGoal,
        onboarding_complete: true,
      });
      window.location.href = '/';
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    // Step 0: Username & Photo
    <div key="profile" className="flex flex-col items-center gap-8">
      <div>
        <h2 className="text-2xl font-black text-center">Set Up Your Profile</h2>
        <p className="text-muted-foreground text-center mt-2">Choose a username and add a photo</p>
      </div>
      <div className="relative">
        <label className="cursor-pointer">
          <div className="w-28 h-28 rounded-full bg-secondary border-2 border-dashed border-primary/40 flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </label>
      </div>
      <div className="w-full max-w-xs">
        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Username</Label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your_username"
          className="mt-1 bg-secondary border-border text-foreground"
        />
      </div>
      <Button onClick={() => setStep(1)} disabled={!username.trim()} className="w-full max-w-xs font-bold">
        Continue
      </Button>
    </div>,
    // Step 1: Fitness Level
    <div key="fitness" className="flex flex-col items-center gap-8">
      <div>
        <h2 className="text-2xl font-black text-center">Fitness Level</h2>
        <p className="text-muted-foreground text-center mt-2">Where are you on your fitness journey?</p>
      </div>
      <div className="w-full max-w-xs flex flex-col gap-3">
        {FITNESS_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => setFitnessLevel(level.value)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              fitnessLevel === level.value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <p className="font-bold text-foreground">{level.label}</p>
            <p className="text-sm text-muted-foreground">{level.desc}</p>
          </button>
        ))}
      </div>
      <Button onClick={() => setStep(2)} disabled={!fitnessLevel} className="w-full max-w-xs font-bold">
        Continue
      </Button>
    </div>,
    // Step 2: Goal
    <div key="goal" className="flex flex-col items-center gap-8">
      <div>
        <h2 className="text-2xl font-black text-center">Your Goal</h2>
        <p className="text-muted-foreground text-center mt-2">What are you training for?</p>
      </div>
      <div className="w-full max-w-xs flex flex-col gap-3">
        {GOAL_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setPrimaryGoal(value)}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
              primaryGoal === value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${primaryGoal === value ? 'bg-primary/20' : 'bg-secondary'}`}>
              <Icon className={`w-5 h-5 ${primaryGoal === value ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <p className="font-bold text-foreground">{label}</p>
          </button>
        ))}
      </div>
      <Button onClick={handleFinish} disabled={!primaryGoal || saving} className="w-full max-w-xs font-bold">
        {saving ? 'Setting up...' : "Let's Go 🔥"}
      </Button>
    </div>,
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-primary tracking-tight">SWEATSTAKE</h1>
        <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Stake. Sweat. Win.</p>
      </div>
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 w-12 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-sm"
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}