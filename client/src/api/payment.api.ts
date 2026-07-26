import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";
import { AxiosError } from "axios";
import { toast } from "sonner";
import type {
  IOrderCreatePayload,
  IOrderCreateResponse,
  IPaymentCreatePayload,
  IPaymentResponse,
  IOrderResponse,
} from "@/types/order";

interface ApiErrorResponse {
  message?: string;
  detail?: string;
  error?: string;
}

/**
  POST /orders - Create order and initiate Cashfree session
 */
export const createOrder = async (
  payload: IOrderCreatePayload
): Promise<IOrderCreateResponse> => {
  const response = await axiosClient.post<IOrderCreateResponse>("/orders", payload);
  return response.data;
};

/**
  POST /payments/create - Create payment session for an existing order
 */
export const createPayment = async (
  payload: IPaymentCreatePayload
): Promise<IPaymentResponse> => {
  const response = await axiosClient.post<IPaymentResponse>("/payments/create", payload);
  return response.data;
};

/**
  GET /orders/:id - Fetch details of an order
 */
export const getOrderDetails = async (orderId: string): Promise<IOrderResponse> => {
  const response = await axiosClient.get<IOrderResponse>(`/orders/${orderId}`);
  return response.data;
};

/**
  TanStack Query Hook: useCheckout / useCreatePayment
  Executes order creation + Cashfree checkout redirect
 */
export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation<IOrderCreateResponse, AxiosError<ApiErrorResponse>, IOrderCreatePayload>({
    mutationFn: async (payload: IOrderCreatePayload) => {
      return await createOrder(payload);
    },
    onMutate: () => {
      toast.loading("Redirecting to Secure Payment...", { id: "checkout-toast" });
    },
    onSuccess: (data: IOrderCreateResponse) => {
      toast.dismiss("checkout-toast");
      
      const paymentSessionId = data.payment_session_id;
      const paymentMode = data.payment_mode || "sandbox";

      if (paymentSessionId) {
        toast.success("Order created! Opening Cashfree Payment Gateway...");
        try {
          const cashfree = (window as any).Cashfree({
            mode: paymentMode,
          });
          
          cashfree.checkout({
            paymentSessionId: paymentSessionId,
            redirectTarget: "_self",
          });
        } catch (error) {
          console.error("Cashfree SDK initialization/checkout error:", error);
          toast.error("Failed to initialize Cashfree Payment Gateway. Please try again.");
        }
      } else {
        toast.error("Payment session could not be established. Please try again.");
      }

      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.dismiss("checkout-toast");
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong while processing your order.";
      toast.error(errorMessage);
    },
  });
};

/**
  TanStack Query Hook: useCreatePayment
 */
export const useCreatePayment = () => {
  return useMutation<IPaymentResponse, AxiosError<ApiErrorResponse>, IPaymentCreatePayload>({
    mutationFn: async (payload: IPaymentCreatePayload) => {
      return await createPayment(payload);
    },
    onMutate: () => {
      toast.loading("Initiating Payment...", { id: "payment-toast" });
    },
    onSuccess: (data: IPaymentResponse) => {
      toast.dismiss("payment-toast");
      
      const paymentSessionId = data.payment_session_id;
      const paymentMode = data.payment_mode || "sandbox";

      if (paymentSessionId) {
        toast.success("Payment session created! Opening Cashfree Payment Gateway...");
        try {
          const cashfree = (window as any).Cashfree({
            mode: paymentMode,
          });
          
          cashfree.checkout({
            paymentSessionId: paymentSessionId,
            redirectTarget: "_self",
          });
        } catch (error) {
          console.error("Cashfree SDK initialization/checkout error:", error);
          toast.error("Failed to initialize Cashfree Payment Gateway. Please try again.");
        }
      } else {
        toast.error("Payment session could not be established.");
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.dismiss("payment-toast");
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Payment initiation failed.";
      toast.error(errorMessage);
    },
  });
};

/**
  TanStack Query Hook: Fetch Order Details
 */
export const useFetchOrderDetails = (orderId: string, enabled: boolean = true) => {
  return useQuery<IOrderResponse, AxiosError<ApiErrorResponse>>({
    queryKey: ["orderDetails", orderId],
    queryFn: () => getOrderDetails(orderId),
    enabled: !!orderId && enabled,
    refetchOnWindowFocus: false,
  });
};

/**
  POST /payments/verify/:orderId - Verify and sync payment status with Cashfree
 */
export const verifyPayment = async (orderId: string): Promise<any> => {
  const response = await axiosClient.post(`/payments/verify/${orderId}`);
  return response.data;
};

/**
  TanStack Query Hook: Verify Payment
 */
export const useVerifyPayment = (orderId: string, enabled: boolean = true) => {
  return useQuery<any, AxiosError<ApiErrorResponse>>({
    queryKey: ["verifyPayment", orderId],
    queryFn: () => verifyPayment(orderId),
    enabled: !!orderId && enabled,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
