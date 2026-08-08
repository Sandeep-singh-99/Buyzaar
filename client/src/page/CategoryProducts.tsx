import React, { lazy, Suspense, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Filter, SlidersHorizontal, ChevronRight } from "lucide-react";
const ProductCard = lazy(() => import("@/components/ProductCard"));
import { FilterSidebar } from "@/components/FilterSidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { ProductCardSkeleton } from "@/components/skeleton/ProductCardSkeleton";
import { useGetProductsByCategory } from "@/api/productApi";


export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("featured");
  const [page, setPage] = useState(1);

  // Selected filter controls state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);

  // Applied filters state (sent to query)
  const [appliedFilters, setAppliedFilters] = useState<{
    categories: string[];
    minPrice: number;
    maxPrice: number;
  }>({
    categories: [],
    minPrice: 0,
    maxPrice: 2000,
  });

  useEffect(() => {
    setPage(1);
    const initialCats = slug && slug !== "all" && slug !== "view-all" ? [slug] : [];
    setSelectedCategories(initialCats);
    setAppliedFilters({
      categories: initialCats,
      minPrice: 0,
      maxPrice: 2000,
    });
  }, [slug]);

  const handleCategoryToggle = (categorySlug: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      const lowerSlug = categorySlug.toLowerCase();
      if (checked) {
        if (!prev.map((c) => c.toLowerCase()).includes(lowerSlug)) {
          return [...prev, categorySlug];
        }
        return prev;
      } else {
        return prev.filter((item) => item.toLowerCase() !== lowerSlug);
      }
    });
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({
      categories: selectedCategories,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    });
  };

  const categoryName = slug === "all" || slug === "view-all" 
    ? "All Products" 
    : slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Category";

  const categoryInfo = {
    name: categoryName,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop",
  };

  const queryParams = {
    page: page,
    limit: 8,
    sort_by: sortBy,
    categories: appliedFilters.categories.length > 0 ? appliedFilters.categories.join(",") : undefined,
    min_price: appliedFilters.minPrice > 0 ? appliedFilters.minPrice : undefined,
    max_price: appliedFilters.maxPrice < 2000 ? appliedFilters.maxPrice : undefined,
  };

  const { data, isLoading } = useGetProductsByCategory(slug || "all", queryParams);
  const displayProducts = data?.products || [];
  const totalPages = data ? Math.ceil(data.total / 8) : 1;

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const filterSidebarProps = {
    selectedCategories,
    onCategoryToggle: handleCategoryToggle,
    priceRange,
    onPriceRangeChange: setPriceRange,
    onApplyFilters: handleApplyFilters,
  };


  return (
    <div>
      {/* Category Header Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-900 border-b border-border">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10" />
          <img
            src={categoryInfo.image}
            alt={categoryInfo.name}
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="container relative z-20 h-full flex flex-col justify-end pb-12 px-4 md:px-10">
          <nav className="flex text-sm text-slate-300 mb-4 opacity-80">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/products" className="hover:text-white transition-colors">
              Categories
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-white font-medium">{categoryInfo.name}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {categoryInfo.name}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-10 py-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <p className="text-muted-foreground">
            Showing {data?.total || 0} products
          </p>

          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden flex-1">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[340px]">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your product search
                  </SheetDescription>
                </SheetHeader>
                <FilterSidebar {...filterSidebarProps} />
              </SheetContent>
            </Sheet>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                <SlidersHorizontal className="h-4 w-4 hidden md:block text-muted-foreground" />
                <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-28">
              <FilterSidebar {...filterSidebarProps} />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : (
                displayProducts.map((product) => (
                  <Suspense fallback={<ProductCardSkeleton />} key={product.id}>
                    <ProductCard product={product} />
                  </Suspense>
                ))
              )}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <Pagination className="mt-8 mb-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNumber = idx + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          isActive={page === pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
