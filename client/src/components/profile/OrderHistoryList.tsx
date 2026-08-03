import React, { useState } from "react";
import type { IMockOrder, IMockProductItem } from "@/data/mockProfileData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PackageCheck,
  Truck,
  Clock,
  XCircle,
  Search,
  RotateCcw,
  FileText,
  ShoppingBag,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch } from "@/hooks/hooks";
import { addToCart } from "@/redux/slice/cartSlice";
import type { IProduct } from "@/types/product";

interface OrderHistoryListProps {
  orders: IMockOrder[];
}

export const OrderHistoryList: React.FC<OrderHistoryListProps> = ({ orders }) => {
  const dispatch = useAppDispatch();
  const [selectedTab, setSelectedTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<IMockOrder | null>(null);

  // Filter orders based on tab & search query
  const filteredOrders = orders.filter((order) => {
    const matchesTab =
      selectedTab === "All" ||
      order.orderStatus.toLowerCase() === selectedTab.toLowerCase();

    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 capitalize">
            <PackageCheck className="h-3.5 w-3.5" /> Delivered
          </Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 gap-1 capitalize">
            <Truck className="h-3.5 w-3.5" /> Shipped
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30 gap-1 capitalize">
            <CheckCircle className="h-3.5 w-3.5" /> Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 capitalize">
            <Clock className="h-3.5 w-3.5" /> Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1 capitalize">
            <XCircle className="h-3.5 w-3.5" /> Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  const handleBuyAgain = (item: IMockProductItem) => {
    const productPayload: IProduct = {
      id: item.product_id || item.id,
      name: item.name,
      brand: "Buyzaar",
      price: item.price,
      sales_price: item.price,
      category: item.category,
      description: item.name,
      images: [{ url: item.image, is_primary: true }],
      image: { url: item.image, is_primary: true },
      created_at: new Date().toISOString(),
    };

    dispatch(addToCart({ product: productPayload, quantity: 1 }));
    toast.success(`Added "${item.name}" back to your cart!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" /> Order History ({orders.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            View order details, status, and purchased product items
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search order ID or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-xl bg-background/80"
          />
        </div>
      </div>

      {/* Filter Tabs matching backend order statuses */}
      <Tabs defaultValue="All" onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full max-w-2xl h-10 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="All" className="text-xs font-semibold rounded-lg">
            All ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="text-xs font-semibold rounded-lg capitalize">
            Confirmed
          </TabsTrigger>
          <TabsTrigger value="shipped" className="text-xs font-semibold rounded-lg capitalize">
            Shipped
          </TabsTrigger>
          <TabsTrigger value="delivered" className="text-xs font-semibold rounded-lg capitalize">
            Delivered
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs font-semibold rounded-lg capitalize">
            Pending
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs font-semibold rounded-lg capitalize">
            Cancelled
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 text-center py-12">
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-foreground">No orders found</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We couldn't find any orders matching your selected filter or search query.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTab("All");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="border border-border/60 shadow-xs hover:border-primary/30 transition-all overflow-hidden"
            >
              {/* Order Card Top Header */}
              <CardHeader className="bg-muted/30 border-b border-border/50 py-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Order ID
                    </span>
                    <p className="text-sm font-extrabold text-foreground font-mono">
                      {order.orderNumber}
                    </p>
                  </div>
                  <div className="hidden sm:block text-border">|</div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Date Placed
                    </span>
                    <p className="text-xs font-medium text-foreground">{order.date}</p>
                  </div>
                  <div className="hidden sm:block text-border">|</div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Total Amount
                    </span>
                    <p className="text-xs font-bold text-primary">
                      ${order.totalAmount.toFixed(2)} ({order.itemCount} {order.itemCount === 1 ? "item" : "items"})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order.orderStatus)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setActiveInvoiceOrder(order)}
                  >
                    <FileText className="h-3.5 w-3.5" /> Invoice
                  </Button>
                </div>
              </CardHeader>

              {/* Ordered Products List */}
              <CardContent className="p-5 space-y-4">
                <div className="divide-y divide-border/40">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-xl border border-border/50 shadow-xs shrink-0"
                        />
                        <div className="space-y-1">
                          <h5 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                            {item.name}
                          </h5>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="bg-muted px-2 py-0.5 rounded-md font-medium">
                              {item.category}
                            </span>
                            {item.variant && (
                              <span>Variant: <strong className="text-foreground">{item.variant}</strong></span>
                            )}
                            <span className="font-mono text-[11px]">SKU: {item.sku}</span>
                          </div>
                          <p className="text-xs font-semibold text-foreground/80 pt-0.5">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Product Price & Action Buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                        <span className="text-sm font-extrabold text-foreground">
                          ${(item.subtotal || item.price * item.quantity).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs font-medium gap-1.5 rounded-lg"
                            onClick={() => handleBuyAgain(item)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Buy Again
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Bar of Order Card (Payment provider & status) */}
                <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Payment Gateway: {order.paymentProvider}</span>
                    <span>•</span>
                    <span className="font-semibold text-foreground">
                      Status:{" "}
                      <span className={order.paymentStatus === "SUCCESS" ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 font-bold"}>
                        {order.paymentStatus}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1.5 rounded-lg w-full sm:w-auto"
                      onClick={() => setActiveInvoiceOrder(order)}
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" /> Order Receipt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      {activeInvoiceOrder && (
        <Dialog open={!!activeInvoiceOrder} onOpenChange={() => setActiveInvoiceOrder(null)}>
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Order Invoice
              </DialogTitle>
              <DialogDescription>
                Official receipt for Order #{activeInvoiceOrder.orderNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4 border-y border-border/60">
              <div className="flex justify-between text-xs font-semibold">
                <div>
                  <p className="text-muted-foreground uppercase">Billed To</p>
                  <p className="text-foreground text-sm font-bold">{activeInvoiceOrder.shippingAddress.name}</p>
                  <p className="text-muted-foreground">{activeInvoiceOrder.shippingAddress.street}</p>
                  <p className="text-muted-foreground">
                    {activeInvoiceOrder.shippingAddress.city}, {activeInvoiceOrder.shippingAddress.state} {activeInvoiceOrder.shippingAddress.zipCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground uppercase">Order Date</p>
                  <p className="text-foreground text-sm font-bold">{activeInvoiceOrder.date}</p>
                  <p className="text-muted-foreground uppercase pt-2">Payment Gateway</p>
                  <p className="text-foreground font-medium">{activeInvoiceOrder.paymentProvider}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    {activeInvoiceOrder.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-bold text-foreground">{it.name}</td>
                        <td className="p-2.5 text-center">{it.quantity}</td>
                        <td className="p-2.5 text-right">${it.price.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold">${(it.subtotal || it.price * it.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <div className="w-48 space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>${activeInvoiceOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping:</span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-foreground pt-2 border-t border-border">
                    <span>Total Paid:</span>
                    <span>${activeInvoiceOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                className="rounded-lg gap-2"
                onClick={() => {
                  toast.success(`Invoice for ${activeInvoiceOrder.orderNumber} downloaded!`);
                  setActiveInvoiceOrder(null);
                }}
              >
                <FileText className="h-4 w-4" /> Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
