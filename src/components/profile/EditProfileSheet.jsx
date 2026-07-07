import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function EditProfileSheet({ open, onOpenChange, profile, onSaved }) {
  const [username, setUsername] = useState(profile?.username || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setUsername(profile?.username || '');
      setPhotoUrl(profile?.photo_url || '');
    }
  }, [open, profile]);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast({ title: 'Username required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, {
        username: username.trim(),
        photo_url: photoUrl,
      });
      await onSaved();
      toast({ title: 'Profile updated' });
      onOpenChange(false);
    } catch {
      toast({ title: 'Could not save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl bg-card border-border">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-black">Edit Profile</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-secondary border-2 border-primary/20 overflow-hidden flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-muted-foreground">
                    {username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Tap to change photo</p>
          </div>

          {/* Username */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 bg-secondary border-border"
              placeholder="Enter username"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full font-bold rounded-2xl h-12">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : 'Save Changes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}