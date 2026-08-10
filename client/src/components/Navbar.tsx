import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { SearchModal } from "./SearchModal";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import { useSignOut } from "@/api/authApi";
import { useFetchCartProducts } from "@/api/cartApi";
import { logout } from "@/redux/slice/authSlice";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Navbar() {
  const { user } = useAppSelector((state) => state.auth);
  const { items } = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  const { mutateAsync: signOut } = useSignOut();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut (⌘K or Ctrl+K) to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync cart data with redux if user is logged in
  useFetchCartProducts(!!user);

  const handleLogout = async () => {
    await signOut();
    dispatch(logout());
  };

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-slate-50/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm transition-all h-22 flex flex-col justify-center">
      <div className="container mx-auto px-4 md:px-10 flex items-center justify-between">
        {/* Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">
              Buyzaar
            </h1>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop Search Trigger Pill */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-all shadow-2xs group cursor-pointer"
            title="Search products (⌘K)"
          >
            <Search className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span>Search products...</span>
            <kbd className="hidden lg:inline-flex items-center pointer-events-none h-4 select-none rounded border border-border/70 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Icon Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden relative hover:bg-accent/60"
            title="Search products"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search products</span>
          </Button>

          {/* Search Modal */}
          <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />

          <ModeToggle />


          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-violet-500 text-white rounded-full">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full ml-1"
                >
                  <Avatar className="h-9 w-9 border border-border/50">
                    <AvatarImage
                      src={user.profile_image}
                      alt={user.user_name}
                    />
                    <AvatarFallback>
                      {user.user_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin"
                      className="cursor-pointer flex items-center"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <Button variant="ghost" asChild className="hidden lg:flex">
                <Link to="/login">Log In</Link>
              </Button>
              <Button
                asChild
                className="rounded-full shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform"
              >
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
