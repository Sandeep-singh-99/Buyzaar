import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAppSelector } from "@/hooks/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "RAG & AI", url: "/admin/rag", icon: Sparkles },
];

export function AdminLayout() {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <SidebarProvider>
      <Toaster />
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-background">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border h-[60px] flex items-center px-4">
            <Link
              to={"/"}
              className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 hidden group-data-[state=expanded]:block"
            >
              Buyzaar Admin
            </Link>
            <Link
              to={"/"}
              className="font-bold text-xl text-violet-500 group-data-[state=expanded]:hidden block"
            >
              B
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <div>
                    <Avatar className="h-6 w-6 rounded-md">
                      <AvatarImage src={user?.profile_image} />
                      <AvatarFallback className="rounded-md">AD</AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {user?.user_name || "Admin User"}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-destructive cursor-pointer">
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="h-[60px] border-b border-border bg-card flex items-center px-6 shrink-0">
            <SidebarTrigger className="-ml-2 mr-2" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
