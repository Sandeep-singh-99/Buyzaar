import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

export function MainLayout() {

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster />
      <Navbar />
      <main className="flex-grow pt-[88px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
