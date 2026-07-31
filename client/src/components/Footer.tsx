import React from "react";
import { Link } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-card border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand & About */}
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 mb-6">
              Buyzaar
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Your one-stop destination for premium products. We offer the best quality items with fast shipping and excellent customer service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-muted-foreground hover:text-violet-500 transition-colors">Home</Link></li>
              <li><Link to="/products" className="text-muted-foreground hover:text-violet-500 transition-colors">Shop All</Link></li>
              <li><Link to="/category/electronics" className="text-muted-foreground hover:text-violet-500 transition-colors">Electronics</Link></li>
              <li><Link to="/category/clothing" className="text-muted-foreground hover:text-violet-500 transition-colors">Clothing</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Customer Service</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-violet-500 transition-colors">Track Order</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-violet-500 transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-violet-500 transition-colors">FAQ</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-violet-500 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Stay Updated</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to our newsletter to get the latest updates and offers.
            </p>
            <div className="flex space-x-2">
              <Input placeholder="Enter your email" className="bg-background" />
              <Button size="icon" className="shrink-0"><Mail size={18} /></Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Buyzaar. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
