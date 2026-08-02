import React from "react";
import {
  CreditCard,
  DollarSign,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTotalUsers } from "@/api/authApi";
import { useGetTotalProducts } from "@/api/productApi";
import {
  useGetLatestOrders,
  useGetTotalOrders,
  useGetTotalRevenue,
} from "@/api/payment.api";

export default function Dashboard() {
  const { data } = useTotalUsers();

  const { data: totalProducts } = useGetTotalProducts();

  const { data: totalOrders } = useGetTotalOrders();

  const { data: totalRevenue } = useGetTotalRevenue();

  const { data: latestOrders } = useGetLatestOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your store's performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(totalRevenue?.total_revenue ?? 0).toLocaleString(
                "en-IN",
                {
                  style: "currency",
                  currency: "INR",
                },
              )}
            </div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{totalOrders?.total_orders ?? 0}
            </div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +15.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{totalProducts?.total_products ?? 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              +12 new this week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{data?.total_users ?? 0}</div>
            <p className="text-xs text-red-500 flex items-center mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" /> -2.4% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue for the current year
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full flex items-end justify-between px-4 pb-4 gap-2 border-b border-l border-border relative">
              {/* Simple CSS Chart Placeholder */}
              <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between pt-4 pb-4 text-[10px] text-muted-foreground opacity-50">
                <div className="border-t border-border/50 w-full text-right pr-2 -mt-1.5">
                  $50k
                </div>
                <div className="border-t border-border/50 w-full text-right pr-2 -mt-1.5">
                  $37.5k
                </div>
                <div className="border-t border-border/50 w-full text-right pr-2 -mt-1.5">
                  $25k
                </div>
                <div className="border-t border-border/50 w-full text-right pr-2 -mt-1.5">
                  $12.5k
                </div>
                <div className="text-right pr-2">0</div>
              </div>

              <div className="w-full flex justify-between items-end h-full pl-8 z-10 gap-2">
                {[30, 45, 20, 60, 80, 50, 90, 75, 85, 40, 65, 55].map(
                  (height, i) => (
                    <div
                      key={i}
                      className="w-full flex flex-col items-center gap-2 group"
                    >
                      <div
                        className="w-full bg-primary/20 hover:bg-violet-500 rounded-t-sm transition-colors relative"
                        style={{ height: `${height}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow-md pointer-events-none transition-opacity">
                          ${height * 500}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {
                          [
                            "Jan",
                            "Feb",
                            "Mar",
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dec",
                          ][i]
                        }
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest transactions from your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestOrders?.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.order_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "Delivered"
                              ? "default"
                              : order.status === "Processing"
                                ? "secondary"
                                : order.status === "Cancelled"
                                  ? "destructive"
                                  : "outline"
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(order.total).toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
