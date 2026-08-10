import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { useAppSelector } from "@/hooks/hooks";
import { CartItemCard } from "@/components/CartItemCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useFetchCartProducts } from "@/api/cartApi";
import { CartPageSkeleton } from "@/components/skeleton/CartPageSkeleton";

export default function Cart() {
  const { items } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading } = useFetchCartProducts(!!user);

  if (isLoading) {
    return <CartPageSkeleton />;
  }

  const subtotal = items.reduce(
    (total, item) =>
      total +
      Number(item.product.sales_price || item.product.price || 0) *
        item.quantity,
    0,
  );
  const shipping = subtotal > 100 ? 0 : 15.0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 md:px-10 py-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Looks like you haven't added anything to your cart yet. Discover our
          premium products and find what you love.
        </p>
        <Button size="lg" asChild className="rounded-full px-8">
          <Link to="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-10 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg">Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 divide-y divide-border">
              {items.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="border-border/50 shadow-sm sticky top-28">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>
                  {Number(subtotal).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Tax (8%)</span>
                <span>
                  {Number(tax).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                {shipping === 0 ? (
                  <span className="text-emerald-500 font-medium">Free</span>
                ) : (
                  <span>
                    {Number(shipping).toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                    })}
                  </span>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>
                  {Number(total).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </span>
              </div>

              <div className="pt-4 pb-2">
                <div className="flex space-x-2">
                  <Input placeholder="Promo code" className="bg-background" />
                  <Button variant="outline">Apply</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-6 pt-2 pb-6 flex flex-col gap-2">
              <Button size="lg" className="w-full text-base" asChild>
                <Link to="/checkout">
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center justify-center text-xs text-muted-foreground gap-1">
                <ShieldCheck className="h-4 w-4" /> Secure Checkout
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
