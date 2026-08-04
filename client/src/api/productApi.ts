import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosClient } from "./axiosClient";
import type { IProducts, ProductQueryParams, Product } from "@/types/product";
import { toast } from "sonner";

interface ApiErrorResponse {
  message: string;
}

interface TotalProductsResponse {
  total_products: number;
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<IProducts, AxiosError<ApiErrorResponse>, FormData>({
    mutationFn: async (formData: FormData) => {
      const response = await axiosClient.post(
        "/api/products/create-product",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    },
    onSuccess: (data: IProducts) => {
      toast.success("Product created Successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data.message || error.message;
      toast.error(errorMessage);
    },
  });
};

export const useGetProducts = (params: ProductQueryParams = {}) => {
  return useQuery<IProducts, AxiosError<ApiErrorResponse>>({
    queryKey: ["products", params],

    queryFn: async () => {
      const response = await axiosClient.get("/api/products/get-products", {
        params,
      });
      return response.data;
    },

    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,

    placeholderData: (previousData) => previousData,
  });
};

export const useGetFeaturedProducts = () => {
  return useQuery<IProducts, AxiosError<ApiErrorResponse>>({
    queryKey: ["featured-products"],

    queryFn: async () => {
      const response = await axiosClient.get(
        "/api/products/get-featured-products",
      );
      return response.data;
    },

    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useGetProductById = (id: string) => {
  return useQuery<Product, AxiosError<ApiErrorResponse>>({
    queryKey: ["product", id],

    queryFn: async () => {
      const response = await axiosClient.get(`/api/products/get-product/${id}`);
      return response.data;
    },

    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,

    placeholderData: (previousData) => previousData,
  });
};

export const useDeleteProductById = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/api/products/delete-product/${id}`);
    },
    onSuccess: (_data, id: string) => {
      toast.success("Product deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data.message || error.message;
      toast.error(errorMessage);
    },
  });
};

export const useUpdateProductById = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: FormData;
    }) => {
      await axiosClient.patch(`/api/products/update-product/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (_data, { id }: { id: string; formData: FormData }) => {
      toast.success("Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data.message || error.message;
      toast.error(errorMessage);
    },
  });
};

export const useGetRelatedProducts = (id: string) => {
  return useQuery<IProducts, AxiosError<ApiErrorResponse>>({
    queryKey: ["related-products", id],

    queryFn: async () => {
      const response = await axiosClient.get(
        `/api/products/get-related-products/${id}`,
      );
      return response.data;
    },

    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useGetProductsByCategory = (
  category_name: string,
  params: ProductQueryParams = {},
) => {
  return useQuery<IProducts, AxiosError<ApiErrorResponse>>({
    queryKey: ["products-by-category", category_name, params],

    queryFn: async () => {
      const response = await axiosClient.get(
        `/api/products/get-products-by-category/${category_name}`,
        { params },
      );
      return response.data;
    },

    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
};


export const useGetTotalProducts = () => {
  return useQuery<TotalProductsResponse | null, AxiosError<ApiErrorResponse>>({
    queryKey: ["total-products"],
    queryFn: async () => {
      const response = await axiosClient.get("/api/products/total-products");
      return response.data;
    },
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};


export const useGetUserTotalOrders = () => {
  return useQuery({
    queryKey: ["user-total-orders"],
    queryFn: async () => {
      const response = await axiosClient.get("/orders/user-total-orders");
      return response.data;
    },
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}