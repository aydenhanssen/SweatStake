export const TIERS = {
  bronze: { label: 'Bronze', workouts: 3, maxSolStake: 0.5, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/30' },
  silver: { label: 'Silver', workouts: 4, maxSolStake: 2, color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/30' },
  gold: { label: 'Gold', workouts: 5, maxSolStake: 5, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  elite: { label: 'Elite', workouts: 6, maxSolStake: 20, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
};

export const MIN_SOL_STAKE = 0.05;

export const WORKOUT_TYPES = {
  push: { label: 'Push', icon: 'ArrowUp' },
  pull: { label: 'Pull', icon: 'ArrowDown' },
  legs: { label: 'Legs', icon: 'Footprints' },
  cardio: { label: 'Cardio', icon: 'Heart' },
  full_body: { label: 'Full Body', icon: 'Dumbbell' },
};

export const GOALS = {
  lose_weight: 'Lose Weight',
  build_muscle: 'Build Muscle',
  stay_consistent: 'Stay Consistent',
};

export const PLATFORM_FEE = 0.10;

export const ADMIN_EMAIL = 'justaydenhanssen@gmail.com';
export const isAdmin = (email) => email?.toLowerCase() === ADMIN_EMAIL;