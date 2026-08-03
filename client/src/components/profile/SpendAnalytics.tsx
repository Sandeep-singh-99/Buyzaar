import React from "react";
import type { IMockSpendMetrics } from "@/data/mockProfileData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  PiggyBank,
  PieChart as PieIcon,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SpendAnalyticsProps {
  metrics: IMockSpendMetrics;
}

export const SpendAnalytics: React.FC<SpendAnalyticsProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend Card */}
        <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-card to-violet-500/5 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Spend
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              ${metrics.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 pt-1">
              <TrendingUp className="h-3.5 w-3.5" /> +14.2% from last month
            </p>
          </CardContent>
        </Card>

        {/* Total Orders Card */}
        <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-card to-sky-500/5 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {metrics.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground font-medium pt-1">
              Across 4 product categories
            </p>
          </CardContent>
        </Card>

        {/* Average Order Value Card */}
        <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-card to-emerald-500/5 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg. Order Value
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              ${metrics.avgOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground font-medium pt-1">
              Consistent purchasing power
            </p>
          </CardContent>
        </Card>

        {/* Total Savings Card */}
        <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-card to-amber-500/5 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Discounts Saved
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PiggyBank className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              ${metrics.totalSaved.toFixed(2)}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium pt-1">
              VIP Promo & Coupon Savings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spending History Chart */}
        <Card className="lg:col-span-2 border border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-500" /> Spending Overview
              </CardTitle>
              <CardDescription>
                Monthly purchase breakdown for recent months
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthlySpend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs font-medium text-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs font-medium text-muted-foreground"
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card, #ffffff)",
                      borderColor: "var(--color-border, #e2e8f0)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      color: "var(--color-foreground, #0f172a)",
                    }}
                    formatter={(value: any) => [`$${value}`, "Spent"]}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Bar
                    dataKey="spend"
                    fill="currentColor"
                    className="fill-violet-500/80 hover:fill-violet-600 transition-colors"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border border-border/60 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-sky-500" /> Category Breakdown
            </CardTitle>
            <CardDescription>
              Spending distribution across categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {metrics.categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{cat.name}</span>
                  <span className="text-muted-foreground font-mono">
                    ${cat.amount.toFixed(2)} ({cat.percentage}%)
                  </span>
                </div>
                <Progress value={cat.percentage} className="h-2.5 bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
