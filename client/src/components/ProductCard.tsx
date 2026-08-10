import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { RatingStars } from "./RatingStars";
import { useAddToCart } from "@/api/cartApi";

// Helper to remove white background from Cloudinary images
const getTransparentImageUrl = (url: string) => {
  if (!url) return "/placeholder.png";
  if (url.includes("res.cloudinary.com")) {
    // e_make_transparent:10 makes white background transparent (tolerance 10)
    // f_png forces PNG format since JPG doesn't support transparency
    return url.replace("/upload/", "/upload/e_make_transparent:10,f_png/");
  }
  return url;
};

export default function ProductCard({ product }: { product: any }) {
  const { mutate: addToCartMutation, isPending: isAddingToCart } =
    useAddToCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
    addToCartMutation({
      product_id: product.id,
      quantity: 1,
      price: product.sales_price || product.price,
    });
  };

  return (
    <Link to={`/products/${product.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-border/50 bg-card flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-muted/20">
          <img
            src={getTransparentImageUrl(
              product.images && product.images.length > 0
                ? typeof product.images[0] === "string"
                  ? product.images[0]
                  : product.images[0].url
                : "",
            )}
            alt={product.name}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {/* Overlay add to cart button on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              className="translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
        <CardContent className="p-4 flex-grow flex flex-col gap-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {product.category}
          </div>
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight transition-colors">
            {product.name}
          </h3>
          {product.rating !== undefined && (
            <div className="flex items-center gap-2 mt-auto pt-2">
              <RatingStars rating={product.rating} size={14} />
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount || 0})
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-2 flex items-center justify-between">
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold">
              {Number(product.sales_price).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            </span>
            {(product.originalPrice ||
              (product.sales_price &&
                product.price &&
                product.sales_price < product.price)) && (
              <span className="text-sm text-muted-foreground line-through mb-0.5">
                {Number(product.price).toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
