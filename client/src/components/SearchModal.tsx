import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  PackageSearch,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { useSearchProducts } from "@/api/productApi";
import type { Product } from "@/types/product";

const CATEGORIES = [
  { name: "All", icon: "✨" },
  { name: "Mobiles", icon: "📱" },
  { name: "Watches", icon: "⌚" },
  { name: "TV", icon: "📺" },
  { name: "Refrigerator", icon: "🧊" },
  { name: "Camera", icon: "📷" },
  { name: "Electronics", icon: "💻" },
  { name: "Shoes", icon: "👟" },
  { name: "Clothing", icon: "👕" },
  { name: "Accessories", icon: "🎒" },
];

const POPULAR_SEARCHES = [
  "Noise Cancelling",
  "Nike Air Max",
  "Apple Watch",
  "Leather Backpack",
  "Cotton T-Shirt",
  "MacBook Pro",
  "Fossil Chronograph",
];

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data, isLoading, isFetching } = useSearchProducts({
    q: searchQuery,
    category: selectedCategory,
    enabled: open,
  });

  const products = data?.products || [];
  const isSearching = isLoading || isFetching;
  const hasFilterActive = searchQuery.trim() !== "" || selectedCategory !== "All";

  const handleSelectProduct = (productId: string) => {
    onOpenChange(false);
    navigate(`/products/${productId}`);
  };

  const handleClear = () => {
    setSearchQuery("");
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-2xl p-0 overflow-hidden gap-0 border border-border/80 bg-background shadow-2xl rounded-2xl"
      >
        <DialogTitle className="sr-only">Search Products</DialogTitle>

        {/* 1. Spotlight Search Bar Header */}
        <div className="relative flex items-center px-4 h-14 border-b border-border/50 bg-background">
          <Search className={`h-5 w-5 text-muted-foreground shrink-0 mr-3 ${isSearching ? "animate-pulse text-primary" : ""}`} />
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type product name, category, brand..."
            className="flex-1 bg-transparent border-none text-base outline-none focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
            autoFocus
          />

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors"
                title="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center rounded border border-border/80 bg-muted/60 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors"
              title="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Category Filter Chips */}
        <div className="px-4 py-2.5 bg-muted/20 border-b border-border/40 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0 mr-1">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Category:</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-all duration-150 flex items-center gap-1.5 shrink-0 border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                      : "bg-background text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-[11px]">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Main Content Container */}
        <div className="max-h-[380px] min-h-[220px] overflow-y-auto p-4 bg-background">
          {/* Skeleton Loaders */}
          {isSearching && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/60 gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Initial State / Popular Searches */}
          {!isSearching && !hasFilterActive && (
            <div className="py-2 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-3 px-1 uppercase tracking-wider">
                  <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                  <span>Popular Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleQuickSearch(term)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border/50 transition-all flex items-center gap-1.5 group cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/30 text-center">
                <p className="text-xs text-muted-foreground">
                  Start typing or select a category above to find products.
                </p>
              </div>
            </div>
          )}

          {/* Empty Search Results */}
          {!isSearching && hasFilterActive && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground">
                <PackageSearch className="h-6 w-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No products found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                We couldn't find matches for "{searchQuery}" {selectedCategory !== "All" ? `in "${selectedCategory}"` : ""}.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs h-8 rounded-full"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
              >
                Reset Search Filters
              </Button>
            </div>
          )}

          {/* Product Results List */}
          {!isSearching && products.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1">
                <span className="font-medium text-foreground">
                  Found {products.length} product{products.length > 1 ? "s" : ""}
                </span>
                {selectedCategory !== "All" && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {selectedCategory}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                {products.map((product: Product) => {
                  const primaryImg =
                    product.images?.find((img) => img.is_primary)?.url ||
                    product.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&auto=format&fit=crop";

                  const discountPct =
                    product.price && product.sales_price && product.price > product.sales_price
                      ? Math.round(((product.price - product.sales_price) / product.price) * 100)
                      : null;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className="group flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-card hover:bg-accent/40 hover:border-primary/50 cursor-pointer transition-all duration-150 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40 relative">
                          <img
                            src={primaryImg}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {discountPct && (
                            <span className="absolute top-0.5 right-0.5 bg-emerald-500 text-white font-bold text-[8px] px-1 rounded-xs">
                              -{discountPct}%
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 shrink-0 font-normal bg-muted/60"
                            >
                              {product.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {product.brand ? `Brand: ${product.brand}` : product.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 pl-2">
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary">
                            ${product.sales_price ?? product.price}
                          </span>
                          {product.price && product.sales_price && product.price > product.sales_price && (
                            <span className="text-xs text-muted-foreground line-through block text-[10px]">
                              ${product.price}
                            </span>
                          )}
                        </div>

                        <div className="h-7 w-7 rounded-full bg-muted/40 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. Footer Bar */}
        <div className="px-4 py-2.5 bg-muted/30 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/80 text-[9px] font-mono shadow-2xs">↵</kbd> select product
            </span>
            <span className="flex items-center gap-1 hidden sm:inline-flex">
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/80 text-[9px] font-mono shadow-2xs">esc</kbd> close
            </span>
          </div>
          <span className="font-semibold text-primary/80">Buyzaar Search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
