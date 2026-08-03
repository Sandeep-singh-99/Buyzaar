import React from "react";
import type { IAuth } from "@/types/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Award,
  Calendar,
  Mail,
  Hash,
  UserCheck,
} from "lucide-react";
import { useAppSelector } from "@/hooks/hooks";

export default function ProfileHeader() {
  const { user } = useAppSelector((state) => state.auth);

  // Derive display user data from Redux state (IAuth) or fallback prop
  const activeUser: IAuth = {
    id: user?.id || "usr_demo_101",
    email: user?.email || "user@example.com",
    user_name: user?.user_name || "John Doe",
    profile_image: user?.profile_image || "",
    role: user?.role || "User",
    created_at: user?.created_at || "2024-01-01",
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? dateStr
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/10 via-background to-sky-500/10 border border-border/60 p-6 md:p-8 shadow-sm backdrop-blur-xl">
      {/* Background Accent Elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Avatar & User Info (IAuth fields) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative group">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-xl ring-2 ring-primary/20 transition-transform group-hover:scale-105">
              <AvatarImage
                src={activeUser.profile_image}
                alt={activeUser.user_name}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {activeUser.user_name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1.5 rounded-full ring-2 ring-background text-xs shadow-md">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {activeUser.user_name}
              </h2>
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold px-3 py-0.5 rounded-full text-xs flex items-center gap-1 shadow-xs capitalize"
              >
                <Award className="h-3.5 w-3.5 text-amber-500" />
                {activeUser.role}
              </Badge>
            </div>

            {/* Display IAuth details: User ID, Email, Created At */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground font-medium pt-1">
              <span className="flex items-center gap-1.5 font-mono text-foreground/80">
                <Hash className="h-3.5 w-3.5 text-primary/70" />
                ID: {activeUser.id}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary/70" />
                {activeUser.email}
              </span>
              {activeUser.created_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                  Joined {formatDate(activeUser.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Edit Profile Button & Account Status */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-border/40">
          {/* Account Status Box */}
          <div className="bg-background/80 dark:bg-card/80 border border-border/60 rounded-2xl p-3 px-4 flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Account Status
              </p>
              <p className="text-sm font-bold text-foreground capitalize">
                {activeUser.role} Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
