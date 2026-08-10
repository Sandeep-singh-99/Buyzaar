import React, { lazy, Suspense, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingStars } from "@/components/RatingStars";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useAddToCart } from "@/api/cartApi";
import MDEditor from "@uiw/react-md-editor";

import { useGetProductById, useGetRelatedProducts } from "@/api/productApi";
import {
  useGetProductRating,
  useGetProductComments,
  useCreateReview,
} from "@/api/reviewApi";
import { useTheme } from "@/components/theme-provider";
import { ProductDetailSkeleton } from "@/components/skeleton/ProductDetailSkeleton";
import { ProductCardSkeleton } from "@/components/skeleton/ProductCardSkeleton";

const ProductCard = lazy(() => import("@/components/ProductCard"));

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { mutate: addToCartMutation, isPending: isAddingToCart } =
    useAddToCart();

  const { data: product, isLoading } = useGetProductById(id as string);
  const { data: relatedData } = useGetRelatedProducts(id as string);
  const { data: ratingData } = useGetProductRating(id as string);
  const { data: commentsData } = useGetProductComments(id as string);
  const { mutate: submitReview, isPending: isSubmittingReview } =
    useCreateReview();

  const relatedProducts = relatedData?.products || [];
  const { theme } = useTheme();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    submitReview(
      { productId: id, rating: reviewRating, comment: reviewComment },
      {
        onSuccess: () => {
          setReviewComment("");
          setReviewRating(5);
        },
      },
    );
  };

  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const galleryImages = product?.images?.map((img) => img.url) || [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
  ];

  if (isLoading || !product) {
    return <ProductDetailSkeleton />;
  }

  const handleAddToCart = () => {
    addToCartMutation({
      product_id: product.id,
      quantity,
      price: product.sales_price || product.price,
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-10 py-8">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to="/products" className="hover:text-primary transition-colors">
          Products
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link
          to={`/category/${product.category.toLowerCase()}`}
          className="hover:text-primary transition-colors"
        >
          {product.brand}
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted/20 rounded-2xl overflow-hidden relative border border-border">
            {product.sales_price && product.sales_price < product.price && (
              <Badge
                className="absolute top-4 left-4 z-10"
                variant="destructive"
              >
                Sale
              </Badge>
            )}
            <img
              src={galleryImages[activeImage]}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? "border-violet-500" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx}`}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2 text-sm text-violet-500 font-semibold uppercase tracking-wider">
            {product.category}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-balance">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <RatingStars rating={ratingData?.average_rating || 0} size={18} />
            <span className="text-sm font-medium text-muted-foreground underline decoration-dashed underline-offset-4 cursor-pointer">
              {ratingData?.total_ratings || 0} Reviews
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm font-medium text-emerald-500">
              In Stock (10)
            </span>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-4xl font-bold">
              {Number(product.sales_price).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            </span>
            {product.sales_price && product.sales_price < product.price && (
              <>
                <span className="text-xl text-muted-foreground line-through mb-1">
                  {Number(product.price).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </span>
                <Badge variant="destructive" className="mb-2 h-6">
                  {Math.round(
                    ((product.price - product.sales_price) / product.price) *
                      100,
                  )}
                  % OFF
                </Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed mb-8">
            {product.description}
          </p>

          <Separator className="mb-8" />

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Quantity</span>
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                max={10}
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 justify-end">
              <Button
                size="lg"
                className="w-full h-12 text-base shadow-lg shadow-primary/20"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isAddingToCart ? "Adding..." : "Add to Cart"}
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
              >
                <Heart className="h-5 w-5 text-muted-foreground hover:text-red-500 transition-colors" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex flex-col items-center justify-center text-center p-2 gap-2">
              <Truck className="h-5 w-5 text-violet-500" />
              <span className="text-xs font-medium">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-2 gap-2">
              <RotateCcw className="h-5 w-5 text-violet-500" />
              <span className="text-xs font-medium">30 Days Return</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-2 gap-2">
              <ShieldCheck className="h-5 w-5 text-violet-500" />
              <span className="text-xs font-medium">1 Year Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-20">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto mb-8">
            <TabsTrigger
              value="details"
              className="text-base py-3 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Product Details
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="text-base py-3 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Reviews ({ratingData?.total_ratings || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="details"
            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
          >
            <div data-color-mode={resolvedTheme}>
              <MDEditor.Markdown
                source={
                  product?.details ||
                  product?.description ||
                  "No details available."
                }
                style={{ backgroundColor: "transparent" }}
              />
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 border border-border p-6 rounded-2xl bg-card h-fit">
                <h3 className="font-semibold text-lg mb-4">Customer Reviews</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl font-bold">
                    {ratingData?.average_rating || 0}
                  </div>
                  <div className="flex flex-col gap-1">
                    <RatingStars rating={ratingData?.average_rating || 0} />
                    <span className="text-sm text-muted-foreground">
                      {ratingData?.total_ratings || 0} global ratings
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {ratingData?.breakdown?.map((item) => (
                    <div key={item.stars} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-12">
                        {item.stars} star
                      </span>
                      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Rating
                    </label>
                    <select
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                    >
                      <option value={5}>5 Stars - Excellent</option>
                      <option value={4}>4 Stars - Very Good</option>
                      <option value={3}>3 Stars - Average</option>
                      <option value={2}>2 Stars - Poor</option>
                      <option value={1}>1 Star - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Comment
                    </label>
                    <textarea
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                      placeholder="What did you like or dislike?"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </div>

              <div className="md:col-span-2 space-y-6">
                {!commentsData?.reviews?.length ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  commentsData.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="pb-6 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground">
                          {review.user_id.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            User {review.user_id.substring(0, 5)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Verified Purchase •{" "}
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <RatingStars rating={review.rating} size={14} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <Suspense key={p.id} fallback={<ProductCardSkeleton />}>
                <ProductCard product={p as any} />
              </Suspense>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
