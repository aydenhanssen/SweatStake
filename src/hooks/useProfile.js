import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
        if (!cancelled && profiles.length > 0) {
          setProfile(profiles[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const refetch = async () => {
    const me = await base44.auth.me();
    const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
    if (profiles.length > 0) setProfile(profiles[0]);
  };

  return { profile, loading, user, refetch };
}