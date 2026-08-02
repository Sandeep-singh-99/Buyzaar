import React, { useState } from "react";
import { Search, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetOrderSummary } from "@/api/payment.api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const limit = 10;

  const { data } = useGetOrderSummary({ page, limit });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            View and manage customer orders.
          </p>
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or customer..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <Badge
              variant="secondary"
              className="px-3 py-1 cursor-pointer whitespace-nowrap"
            >
              All Orders
            </Badge>
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer whitespace-nowrap bg-background text-muted-foreground hover:text-foreground"
            >
              Pending
            </Badge>
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer whitespace-nowrap bg-background text-muted-foreground hover:text-foreground"
            >
              Processing
            </Badge>
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer whitespace-nowrap bg-background text-muted-foreground hover:text-foreground"
            >
              Delivered
            </Badge>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.orders.map((order) => (
                <TableRow key={order.order_id}>
                  <TableCell className="font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.date).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.items} items</TableCell>
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
                      className={
                        order.status === "Pending"
                          ? "border-amber-500 text-amber-500"
                          : ""
                      }
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.orders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground">
        <span>
          Showing {(page - 1) * limit + 1} -
          {Math.min(page * limit, data?.total ?? 0)} of {data?.total} orders
        </span>

        <span>
          Page {page} of {data?.total_pages}
        </span>
      </div>

      <div className="border-t p-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
                onClick={(e) => {
                  e.preventDefault();

                  if (page > 1) {
                    setPage(page - 1);
                  }
                }}
              />
            </PaginationItem>

            {Array.from({ length: data?.total_pages ?? 0 }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  isActive={page === index + 1}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(index + 1);
                  }}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                className={
                  page === data?.total_pages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
                onClick={(e) => {
                  e.preventDefault();

                  if (page < (data?.total_pages ?? 1)) {
                    setPage(page + 1);
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
