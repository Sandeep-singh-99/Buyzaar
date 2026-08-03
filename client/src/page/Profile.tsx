import { useState } from "react";
import { useAppSelector } from "@/hooks/hooks";
import {
  mockUserProfile,
  mockSpendMetrics,
  mockOrders,
} from "@/data/mockProfileData";
import type { IAuth } from "@/types/auth";
import type { IMockUserProfile } from "@/data/mockProfileData";
import { OrderHistoryList } from "@/components/profile/OrderHistoryList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  ShoppingBag,
  MapPin,
  Shield,
  Plus,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SpendAnalytics from "@/components/profile/SpendAnalytics";

export default function Profile() {
  const { user } = useAppSelector((state) => state.auth);

  // Merge redux user if present with mock profile
  const [profileData, setProfileData] = useState<IMockUserProfile>({
    ...mockUserProfile,
    name: user?.user_name || mockUserProfile.name,
    email: user?.email || mockUserProfile.email,
    avatar: user?.profile_image || mockUserProfile.avatar,
  });


  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Breadcrumb Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-500 to-sky-500">
          My Account & Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          View your profile details, monitor spending analytics, and manage past orders.
        </p>
      </div>

      {/* Profile Header Hero Card */}
      <ProfileHeader />

      {/* Main Feature Tabs */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-11 p-1 bg-muted/80 backdrop-blur-md rounded-2xl">
          <TabsTrigger value="orders" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
            <ShoppingBag className="h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
            <BarChart3 className="h-4 w-4" /> Spend
          </TabsTrigger>
          <TabsTrigger value="addresses" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
            <MapPin className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Orders History & Products */}
        <TabsContent value="orders" className="space-y-6 animate-in fade-in-50 duration-300">
          <OrderHistoryList orders={mockOrders} />
        </TabsContent>

        {/* Tab 2: Spend Analytics */}
        <TabsContent value="analytics" className="space-y-6 animate-in fade-in-50 duration-300">
          <SpendAnalytics />
        </TabsContent>

        {/* Tab 3: Saved Addresses & Security */}
        <TabsContent value="addresses" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Addresses Section */}
            <Card className="border border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Saved Delivery Addresses
                  </CardTitle>
                  <CardDescription>Manage your primary shipping destinations</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-xl text-xs font-semibold"
                  onClick={() => toast.info("Add new address feature coming soon!")}
                >
                  <Plus className="h-4 w-4" /> Add New
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-2xl border border-border/60 bg-card/60 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{addr.type} Address</span>
                        {addr.isDefault && (
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{addr.street}</p>
                      <p className="text-xs text-muted-foreground">
                        {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => toast.success(`Selected ${addr.type} as primary shipping address`)}
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Account Security Section */}
            <Card className="border border-border/60 shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-sky-500" /> Account Security & Preferences
                </CardTitle>
                <CardDescription>Password, authentication & notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-foreground">Password</p>
                    <p className="text-xs text-muted-foreground">Last updated 3 months ago</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-semibold gap-1.5"
                    onClick={() => toast.info("Password change request link sent to email!")}
                  >
                    <Lock className="h-3.5 w-3.5" /> Change
                  </Button>
                </div>

                <div className="p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-foreground">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Enabled via SMS
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => toast.info("2FA settings updated")}
                  >
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
