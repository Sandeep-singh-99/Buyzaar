export interface IShippingAddress {
  name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface IOrderItemInput {
  product_id: string;
  quantity: number;
}

export interface IOrderCreatePayload {
  shipping_address?: IShippingAddress;
  items: IOrderItemInput[];
}

export interface IOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IOrderResponse {
  id: string;
  user_id: string;
  order_number: string;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
  items: IOrderItem[];
}

export interface IOrderCreateResponse {
  message: string;
  order: IOrderResponse;
  payment_session_id?: string;
  payment_mode?: string;
}

export interface IPaymentCreatePayload {
  order_id: string;
  user_id: string;
  amount: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface IPaymentResponse {
  payment_session_id: string;
  payment_mode?: string;
  order_id: string;
  transaction_id?: string;
  status: string;
}


export interface IOrderSummary {
  order_id: string;
  order_number: string;
  date: string;
  customer_name: string;
  total: number;
  items: number;
  status: string;
}

export interface OrderSummary {
  order_id: string;
  order_number: string;
  date: string;
  customer_name: string;
  items: number;
  status: string;
  total: string;
}

export interface OrderSummaryResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  orders: OrderSummary[];
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface UserTotalRevenue {
  total_revenue: number;
  average_transaction_value: number;
}