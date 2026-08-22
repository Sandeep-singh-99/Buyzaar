import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dummyProducts, dummyCategories } from '@/lib/data';
const ProductCard = lazy(() => import("@/components/ProductCard"));  
const CategoryCard = lazy(() => import('@/components/CategoryCard'));

import { ProductCardSkeleton } from '@/components/skeleton/ProductCardSkeleton';
import { CategoryCardSkeleton } from '@/components/skeleton/CategoryCardSkeleton';
import { useGetFeaturedProducts } from '@/api/productApi';
import { AiChatSection } from '@/components/AiChatSection';

export default function Home() {
  const trendingProducts = dummyProducts.filter(p => p.badge === 'Trending').slice(0, 4);

  const { data, isLoading, isError } = useGetFeaturedProducts();

  const categories = data?.products || [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden bg-slate-900 dark:bg-background border-b border-border">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container relative z-20 px-4 md:px-10">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-violet-500/20 text-violet-300 font-medium text-sm mb-6 border border-violet-500/30">
              New Collection 2026
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Elevate Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-primary">Lifestyle</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-lg leading-relaxed">
              Discover our curated collection of premium products designed to enhance your everyday experiences.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild className="rounded-full px-8 h-12 text-base">
                <Link to="/products">Shop Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full px-8 h-12 text-base bg-transparent border-slate-600 text-white hover:bg-slate-800 hover:text-white">
                <Link to="/category/electronics">Explore Electronics</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="py-12 bg-slate-50 dark:bg-card/50 border-b border-border flex justify-center items-center">
        <div className="container px-4 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Free Shipping</h3>
                <p className="text-muted-foreground text-sm">On all orders over $100</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Fast Delivery</h3>
                <p className="text-muted-foreground text-sm">24-48 hours delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure Payment</h3>
                <p className="text-muted-foreground text-sm">100% secure checkout</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Showcase */}
      <section className="py-20 flex justify-center items-center">
        <div className="container px-4 md:px-10">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">Discover products across our top categories</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/category/all">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {dummyCategories.map(category => (
              <Suspense key={category.id} fallback={<CategoryCardSkeleton />}>
                <CategoryCard category={category} />
              </Suspense>
            ))}
          </div>
          <Button variant="outline" asChild className="w-full mt-8 sm:hidden">
            <Link to="/category/all">View All Categories</Link>
          </Button>
        </div>
      </section>

      {/* AI Assistant Chat Section */}
      <section className="py-16 bg-slate-100 dark:bg-card/50 border-y border-border flex justify-center items-center">
        <div className="container px-4 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold text-xs mb-3 border border-violet-500/20">
              <Sparkles className="h-3.5 w-3.5" /> AI Product Assistant
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Ask Groq AI for Recommendations</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Need help choosing? Ask questions like "Suggest a mobile under 10000" or "Best gaming phones" to get instant RAG-backed product recommendations!
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <AiChatSection />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-slate-50 dark:bg-card/30 flex justify-center items-center">
        <div className="container px-4 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground">
              Handpicked premium items that define quality and style. Explore our best selection for you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            ) : isError ? (
              <div className="col-span-full text-center py-10 text-destructive">
                Failed to load featured products.
              </div>
            ) : categories?.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                No featured products available.
              </div>
            ) : (
              categories?.map((product) => (
                <Suspense key={product.id} fallback={<ProductCardSkeleton />}>
                  <ProductCard product={product} />
                </Suspense>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-20 flex justify-center items-center">
        <div className="container px-4 md:px-10">
          <div className="relative rounded-3xl overflow-hidden bg-primary text-primary-foreground">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-900/90 to-primary/80 z-10" />
              <img 
                src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2000&auto=format&fit=crop" 
                alt="Promo" 
                className="w-full h-full object-cover mix-blend-overlay"
              />
            </div>
            <div className="relative z-20 py-16 px-8 md:px-16 lg:w-1/2">
              <span className="uppercase tracking-wider text-sm font-bold mb-4 block text-violet-300">Limited Time Offer</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Get 20% Off Your First Purchase</h2>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Sign up today and receive an exclusive discount code for your first order across all categories.
              </p>
              <Button size="lg" variant="secondary" className="rounded-full px-8">
                Claim Offer
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-20 pb-32 flex justify-center items-center">
        <div className="container px-4 md:px-10">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-bold">Trending Now</h2>
            <Button variant="link" asChild>
              <Link to="/products">See all trending</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            {trendingProducts.map(product => (
              <Suspense key={product.id} fallback={ <ProductCardSkeleton /> }>
                <ProductCard product={product} />
              </Suspense>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
