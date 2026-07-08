import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Search, Star, Loader2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export default function Admin() {
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [profileData, userData] = await Promise.all([
          base44.entities.UserProfile.list('-created_date', 200),
          base44.entities.User.list('-created_date', 200),
        ]);
        setProfiles(profileData);
        setUsers(userData);
      } catch (err) {
        console.error(err);
        toast({ title: 'Failed to load users', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const emailForUserId = (uid) => users.find(u => u.id === uid)?.email || '';

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    return p.username?.toLowerCase().includes(q) || emailForUserId(p.user_id).toLowerCase().includes(q);
  });

  const togglePremium = async (profile) => {
    setTogglingId(profile.id);
    try {
      await base44.entities.UserProfile.update(profile.id, { is_premium: !profile.is_premium });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_premium: !p.is_premium } : p));
      toast({ title: `${profile.username} ${!profile.is_premium ? 'granted' : 'removed'} Premium` });
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-black">Admin Panel</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-foreground">{profiles.length}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{profiles.filter(p => p.is_premium).length}</p>
          <p className="text-xs text-muted-foreground">Premium Users</p>
        </div>
      </div>

      {/* User Management */}
      <div className="mb-3">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">User Management</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email..."
            className="pl-9 bg-card border-border rounded-2xl"
          />
        </div>
      </div>

      {/* User List */}
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center flex-shrink-0">
              {p.photo_url ? (
                <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  {p.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{p.username}</p>
              <p className="text-xs text-muted-foreground truncate">{emailForUserId(p.user_id) || 'No email'}</p>
            </div>
            <Button
              size="sm"
              variant={p.is_premium ? 'default' : 'outline'}
              disabled={togglingId === p.id}
              onClick={() => togglePremium(p)}
              className={`rounded-xl flex-shrink-0 ${p.is_premium ? 'bg-primary' : ''}`}
            >
              {togglingId === p.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Star className={`w-3.5 h-3.5 ${p.is_premium ? 'fill-current' : ''}`} />
                  <span className="ml-1 text-xs font-bold">{p.is_premium ? 'Premium' : 'Grant'}</span>
                </>
              )}
            </Button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}