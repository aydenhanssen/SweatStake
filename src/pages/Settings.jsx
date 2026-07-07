import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Bell, Shield, Crown, HelpCircle, LogOut, Pencil } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import EditProfileSheet from '@/components/profile/EditProfileSheet';

export default function Settings() {
  const { profile, refetch } = useProfile();
  const [reminderTime, setReminderTime] = useState(profile?.reminder_time || '08:00');
  const [privacyPublic, setPrivacyPublic] = useState(profile?.privacy_public ?? true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, {
        reminder_time: reminderTime,
        privacy_public: privacyPublic,
      });
      await refetch();
      toast({ title: 'Saved', description: 'Settings updated.' });
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout('/login');
  };

  const sections = [
    {
      title: 'Profile',
      icon: User,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Username</Label>
                <p className="text-foreground font-semibold">{profile?.username}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="font-bold rounded-xl" onClick={() => setEditOpen(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Fitness Level</Label>
            <p className="text-foreground font-semibold capitalize">{profile?.fitness_level}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Notifications',
      icon: Bell,
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Check-in Reminder Time</Label>
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="mt-1 bg-secondary border-border w-40"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Privacy',
      icon: Shield,
      content: (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Public Profile</p>
            <p className="text-xs text-muted-foreground">Others can see your workouts</p>
          </div>
          <Switch checked={privacyPublic} onCheckedChange={setPrivacyPublic} />
        </div>
      ),
    },
    {
      title: 'Subscription',
      icon: Crown,
      content: (
        <div>
          <p className="text-sm text-foreground font-semibold">
            {profile?.is_premium ? '⭐ Premium — $19/mo' : 'Free Tier'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {profile?.is_premium
              ? 'Unlimited challenges, all tiers, private challenges'
              : 'Bronze tier only, 1 active challenge'}
          </p>
          {!profile?.is_premium && (
            <Button size="sm" className="mt-3 font-bold rounded-xl">
              Upgrade to Premium
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/profile" className="p-2 rounded-xl bg-card border border-border">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black">Settings</h1>
      </div>

      <div className="space-y-4 mb-6">
        {sections.map(s => (
          <div key={s.title} className="bg-card border border-border rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <s.icon className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">{s.title}</h3>
            </div>
            {s.content}
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full font-bold rounded-2xl h-12 mb-3">
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 text-destructive font-semibold text-sm"
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </button>

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        onSaved={refetch}
      />
    </div>
  );
}