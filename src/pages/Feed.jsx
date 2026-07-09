import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { WORKOUT_TYPES } from '@/lib/constants';
import TierBadge from '@/components/shared/TierBadge';
import { Heart, MessageCircle, Flag, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

export default function Feed() {
  const { profile } = useProfile();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.CheckIn.list('-created_date', 50);
        setCheckins(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleLike = async (checkin) => {
    if (!profile) return;
    const alreadyLiked = checkin.liked_by?.includes(profile.user_id);
    const newLikedBy = alreadyLiked
      ? checkin.liked_by.filter(id => id !== profile.user_id)
      : [...(checkin.liked_by || []), profile.user_id];
    await base44.entities.CheckIn.update(checkin.id, {
      likes: newLikedBy.length,
      liked_by: newLikedBy,
    });
    setCheckins(prev => prev.map(c =>
      c.id === checkin.id ? { ...c, likes: newLikedBy.length, liked_by: newLikedBy } : c
    ));
  };

  const handleFlag = async (checkin) => {
    if (!profile) return;
    if (checkin.flagged_by?.includes(profile.user_id)) return;
    const newFlaggedBy = [...(checkin.flagged_by || []), profile.user_id];
    await base44.entities.CheckIn.update(checkin.id, {
      flag_count: newFlaggedBy.length,
      flagged_by: newFlaggedBy,
    });
    setCheckins(prev => prev.map(c =>
      c.id === checkin.id ? { ...c, flag_count: newFlaggedBy.length, flagged_by: newFlaggedBy } : c
    ));
    toast({ title: 'Flagged', description: 'This check-in has been flagged for review.' });
  };

  const loadComments = async (checkinId) => {
    const data = await base44.entities.Comment.filter({ checkin_id: checkinId });
    setComments(prev => ({ ...prev, [checkinId]: data }));
  };

  const handleComment = async (checkinId) => {
    if (!commentText.trim() || !profile) return;
    await base44.entities.Comment.create({
      checkin_id: checkinId,
      user_id: profile.user_id,
      username: profile.username,
      text: commentText,
    });
    setCommentText('');
    loadComments(checkinId);
  };

  const toggleComments = (checkinId) => {
    if (commentingOn === checkinId) {
      setCommentingOn(null);
    } else {
      setCommentingOn(checkinId);
      if (!comments[checkinId]) loadComments(checkinId);
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'following', label: 'Following' },
    { key: 'challenge', label: 'Your Challenge' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-8">
      <h1 className="text-xl font-black font-heading text-gradient-gold mb-6">Activity</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              filter === f.key ? 'bg-gradient-to-r from-primary to-yellow-500 text-primary-foreground shadow-lg shadow-primary/20' : 'glass-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {checkins.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary/40 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No check-ins yet. Be the first!</p>
          </div>
        ) : (
          checkins.map((checkin, idx) => (
            <motion.div
              key={checkin.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="premium-card rounded-3xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-xs font-bold text-muted-foreground border border-border">
                  {checkin.user_photo_url ? (
                    <img src={checkin.user_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    checkin.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">{checkin.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {WORKOUT_TYPES[checkin.workout_type]?.label} · {new Date(checkin.timestamp || checkin.created_date).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Photo */}
              <div className="relative aspect-square bg-secondary">
                <img src={checkin.photo_url} alt="Workout" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 glass-card px-2.5 py-1 rounded-lg">
                  <p className="text-[10px] font-mono text-white">
                    {new Date(checkin.timestamp || checkin.created_date).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Note */}
              {checkin.note && (
                <div className="px-4 pt-3">
                  <p className="text-sm text-foreground">{checkin.note}</p>
                </div>
              )}

              {/* Actions */}
              <div className="p-4 flex items-center gap-5">
                <button
                  onClick={() => handleLike(checkin)}
                  className="flex items-center gap-1.5 text-sm transition-transform hover:scale-110"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      checkin.liked_by?.includes(profile?.user_id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                    }`}
                  />
                  <span className="text-muted-foreground font-semibold">{checkin.likes || 0}</span>
                </button>
                <button
                  onClick={() => toggleComments(checkin.id)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-transform hover:scale-110"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleFlag(checkin)}
                  className={`flex items-center gap-1.5 text-sm ml-auto transition-transform hover:scale-110 ${
                    checkin.flagged_by?.includes(profile?.user_id) ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  {checkin.flag_count > 0 && <span className="text-xs">{checkin.flag_count}</span>}
                </button>
              </div>

              {/* Comments */}
              {commentingOn === checkin.id && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  {comments[checkin.id]?.map(c => (
                    <div key={c.id} className="flex gap-2 mb-2">
                      <span className="font-bold text-xs text-foreground">{c.username}</span>
                      <span className="text-xs text-muted-foreground">{c.text}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 h-9 text-sm bg-secondary border-border rounded-xl"
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(checkin.id)}
                    />
                    <Button size="sm" onClick={() => handleComment(checkin.id)} className="rounded-xl h-9 bg-primary">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}