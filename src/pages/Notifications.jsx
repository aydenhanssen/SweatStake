import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { ArrowLeft, Bell, Trophy, Clock, Flag, Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';

const typeIcons = {
  challenge_starting: Clock,
  daily_reminder: Dumbbell,
  challenge_ending: Clock,
  you_won: Trophy,
  checkin_flagged: Flag,
};

export default function Notifications() {
  const { profile } = useProfile();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      try {
        const data = await base44.entities.Notification.filter({ user_id: profile.user_id }, '-created_date', 50);
        setNotifications(data);
        // Mark all as read
        const unread = data.filter(n => !n.read);
        for (const n of unread) {
          await base44.entities.Notification.update(n.id, { read: true });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="p-2 rounded-xl bg-card border border-border">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                  n.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.read ? 'bg-secondary' : 'bg-primary/10'
                }`}>
                  <Icon className={`w-4 h-4 ${n.read ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_date).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}