import {
  mockOrders,
} from "@/data/mockProfileData";
import { OrderHistoryList } from "@/components/profile/OrderHistoryList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  ShoppingBag,
} from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SpendAnalytics from "@/components/profile/SpendAnalytics";
import { useGetUserOrderHistory } from "@/api/payment.api";

export default function Profile() {
  const { data: userOrders } = useGetUserOrderHistory();

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
        <TabsList className="grid grid-cols-2 w-full max-w-md h-11 p-1 bg-muted/80 backdrop-blur-md rounded-2xl">
          <TabsTrigger value="orders" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
            <ShoppingBag className="h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
            <BarChart3 className="h-4 w-4" /> Spend
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Orders History & Products */}
        <TabsContent value="orders" className="space-y-6 animate-in fade-in-50 duration-300">
          <OrderHistoryList orders={userOrders && userOrders.length > 0 ? userOrders : mockOrders} />
        </TabsContent>


        {/* Tab 2: Spend Analytics */}
        <TabsContent value="analytics" className="space-y-6 animate-in fade-in-50 duration-300">
          <SpendAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
