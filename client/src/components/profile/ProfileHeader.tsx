import React, { useState } from "react";
import type { IMockUserProfile } from "@/data/mockProfileData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck,
  Award,
  Calendar,
  Mail,
  Phone,
  Edit3,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileHeaderProps {
  profile: IMockUserProfile;
  onUpdateProfile?: (updated: Partial<IMockUserProfile>) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name,
    username: profile.username,
    email: profile.email,
    phone: profile.phone,
    bio: profile.bio,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(formData);
    }
    toast.success("Profile updated successfully!");
    setIsEditDialogOpen(false);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/10 via-background to-sky-500/10 border border-border/60 p-6 md:p-8 shadow-sm backdrop-blur-xl">
      {/* Background Accent Elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Avatar & Main User Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative group">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-xl ring-2 ring-primary/20 transition-transform group-hover:scale-105">
              <AvatarImage src={profile.avatar} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {profile.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1.5 rounded-full ring-2 ring-background text-xs shadow-md">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {profile.name}
              </h2>
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold px-3 py-0.5 rounded-full text-xs flex items-center gap-1 shadow-xs"
              >
                <Award className="h-3.5 w-3.5 text-amber-500" />
                {profile.memberTier}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground flex items-center gap-1 font-medium">
              @{profile.username}
            </p>

            <p className="text-xs sm:text-sm text-foreground/80 max-w-lg leading-relaxed pt-1">
              {profile.bio}
            </p>

            {/* Meta details list */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary/70" />
                {profile.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary/70" />
                {profile.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary/70" />
                Joined {profile.joinDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Loyalty Perks & Edit Profile Button */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-border/40">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full gap-2 shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all">
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-primary" /> Edit Personal Information
                  </DialogTitle>
                  <DialogDescription>
                    Update your display name, contact details, and personal bio.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us a bit about yourself..."
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-lg">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Reward Points Box */}
          <div className="bg-background/80 dark:bg-card/80 border border-border/60 rounded-2xl p-3 px-4 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Reward Points
              </p>
              <p className="text-lg font-bold text-foreground">
                {profile.rewardPoints.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">pts</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
