export interface IMockProductItem {
  id: string;
  order_id?: string;
  product_id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
  variant?: string;
  sku: string;
  subtotal: number;
}

export interface IMockOrder {
  id: string;
  orderNumber: string;
  date: string;
  totalAmount: number;
  itemCount: number;
  paymentStatus: "CONFIRMED" | "PENDING" | "SUCCESS" | "FAILED";
  paymentProvider: string;
  orderStatus: "confirmed" | "shipped" | "delivered" | "cancelled" | "pending";
  items: IMockProductItem[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
}

export interface IMockUserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  joinDate: string;
  memberTier: "Platinum VIP" | "Gold Member" | "Silver Member";
  rewardPoints: number;
  addresses: Array<{
    id: string;
    type: "Home" | "Work";
    isDefault: boolean;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>;
}

export interface IMockSpendMetrics {
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  totalSaved: number;
  monthlySpend: Array<{ month: string; spend: number; orders: number }>;
  categoryBreakdown: Array<{ name: string; percentage: number; amount: number; color: string }>;
}

export const mockUserProfile: IMockUserProfile = {
  name: "Alex Morgan",
  username: "alexmorgan",
  email: "alex.morgan@example.com",
  phone: "+1 (555) 234-5678",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
  bio: "Tech enthusiast, mechanical keyboard collector & avid online shopper.",
  joinDate: "January 2024",
  memberTier: "Platinum VIP",
  rewardPoints: 1250,
  addresses: [
    {
      id: "addr-1",
      type: "Home",
      isDefault: true,
      street: "742 Evergreen Terrace",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      country: "United States"
    },
    {
      id: "addr-2",
      type: "Work",
      isDefault: false,
      street: "100 Tech Plaza, Suite 400",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "United States"
    }
  ]
};

export const mockSpendMetrics: IMockSpendMetrics = {
  totalSpent: 2489.50,
  totalOrders: 14,
  avgOrderValue: 177.82,
  totalSaved: 340.00,
  monthlySpend: [
    { month: "Feb", spend: 280.00, orders: 2 },
    { month: "Mar", spend: 340.50, orders: 2 },
    { month: "Apr", spend: 490.00, orders: 3 },
    { month: "May", spend: 310.00, orders: 2 },
    { month: "Jun", spend: 560.00, orders: 3 },
    { month: "Jul", spend: 509.00, orders: 2 }
  ],
  categoryBreakdown: [
    { name: "Electronics & Tech", percentage: 48, amount: 1194.96, color: "var(--color-violet-500, #8b5cf6)" },
    { name: "Fashion & Apparel", percentage: 24, amount: 597.48, color: "var(--color-sky-500, #0ea5e9)" },
    { name: "Home & Office", percentage: 18, amount: 448.11, color: "var(--color-emerald-500, #10b981)" },
    { name: "Accessories", percentage: 10, amount: 248.95, color: "var(--color-amber-500, #f59e0b)" }
  ]
};

export const mockOrders: IMockOrder[] = [
  {
    id: "ord-101",
    orderNumber: "ORD-2026-9842",
    date: "July 28, 2026",
    totalAmount: 499.99,
    itemCount: 2,
    paymentStatus: "SUCCESS",
    paymentProvider: "Cashfree Payment Gateway",
    orderStatus: "delivered",
    shippingAddress: {
      name: "Alex Morgan",
      street: "742 Evergreen Terrace",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      country: "United States",
      phone: "+1 (555) 234-5678",
      email: "alex.morgan@example.com"
    },
    items: [
      {
        id: "item-1",
        product_id: "prod-1",
        name: "Wireless Noise-Canceling Headphones Ultra",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400",
        price: 349.99,
        quantity: 1,
        subtotal: 349.99,
        category: "Electronics",
        variant: "Midnight Black",
        sku: "HD-NC-001"
      },
      {
        id: "item-2",
        product_id: "prod-2",
        name: "Ergonomic Aluminum Laptop Stand",
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=400",
        price: 150.00,
        quantity: 1,
        subtotal: 150.00,
        category: "Accessories",
        variant: "Space Gray",
        sku: "ACC-LS-09"
      }
    ]
  },
  {
    id: "ord-102",
    orderNumber: "ORD-2026-9104",
    date: "July 20, 2026",
    totalAmount: 189.50,
    itemCount: 3,
    paymentStatus: "SUCCESS",
    paymentProvider: "Cashfree UPI",
    orderStatus: "shipped",
    shippingAddress: {
      name: "Alex Morgan",
      street: "742 Evergreen Terrace",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      country: "United States"
    },
    items: [
      {
        id: "item-3",
        product_id: "prod-3",
        name: "Smart RGB Mechanical Gaming Keyboard",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400",
        price: 129.50,
        quantity: 1,
        subtotal: 129.50,
        category: "Electronics",
        variant: "Tactile Brown Switches",
        sku: "KB-RGB-88"
      },
      {
        id: "item-4",
        product_id: "prod-4",
        name: "Minimalist Desk Mat / Mousepad (Large)",
        image: "https://images.unsplash.com/photo-1616440342855-45d6dd0f41ab?auto=format&fit=crop&q=80&w=400",
        price: 35.00,
        quantity: 1,
        subtotal: 35.00,
        category: "Accessories",
        variant: "Charcoal Wool Felt",
        sku: "ACC-DM-02"
      },
      {
        id: "item-5",
        product_id: "prod-5",
        name: "Braided USB-C Fast Charge Cable (2m)",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
        price: 25.00,
        quantity: 1,
        subtotal: 25.00,
        category: "Accessories",
        variant: "Black",
        sku: "ACC-CBL-2M"
      }
    ]
  },
  {
    id: "ord-103",
    orderNumber: "ORD-2026-8550",
    date: "June 14, 2026",
    totalAmount: 560.00,
    itemCount: 1,
    paymentStatus: "SUCCESS",
    paymentProvider: "Cashfree Netbanking",
    orderStatus: "delivered",
    shippingAddress: {
      name: "Alex Morgan",
      street: "742 Evergreen Terrace",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      country: "United States"
    },
    items: [
      {
        id: "item-6",
        product_id: "prod-6",
        name: "4K UHD IPS UltraWide Monitor 34-inch",
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400",
        price: 560.00,
        quantity: 1,
        subtotal: 560.00,
        category: "Electronics",
        variant: "HDR400 USB-C Hub",
        sku: "MON-4K-34UW"
      }
    ]
  },
  {
    id: "ord-104",
    orderNumber: "ORD-2026-7819",
    date: "May 02, 2026",
    totalAmount: 310.00,
    itemCount: 2,
    paymentStatus: "SUCCESS",
    paymentProvider: "Cashfree Credit Card",
    orderStatus: "confirmed",
    shippingAddress: {
      name: "Alex Morgan",
      street: "742 Evergreen Terrace",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      country: "United States"
    },
    items: [
      {
        id: "item-7",
        product_id: "prod-7",
        name: "Premium Breathable Linen Casual Shirt",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400",
        price: 110.00,
        quantity: 2,
        subtotal: 220.00,
        category: "Fashion",
        variant: "Olive Green / L",
        sku: "FSH-SHRT-OL"
      },
      {
        id: "item-8",
        product_id: "prod-8",
        name: "Classic Italian Leather Sneakers",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400",
        price: 90.00,
        quantity: 1,
        subtotal: 90.00,
        category: "Fashion",
        variant: "White / US 10.5",
        sku: "FSH-SNK-WH"
      }
    ]
  },
  {
    id: "ord-105",
    orderNumber: "ORD-2026-6210",
    date: "April 11, 2026",
    totalAmount: 120.00,
    itemCount: 1,
    paymentStatus: "FAILED",
    paymentProvider: "Cashfree Card",
    orderStatus: "cancelled",
    shippingAddress: {
      name: "Alex Morgan",
      street: "742 Evergreen Terrace",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      country: "United States"
    },
    items: [
      {
        id: "item-9",
        product_id: "prod-9",
        name: "Smart Fitness Watch Tracker",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400",
        price: 120.00,
        quantity: 1,
        subtotal: 120.00,
        category: "Electronics",
        variant: "Black Silicon Band",
        sku: "WCH-SMT-BLK"
      }
    ]
  }
];
