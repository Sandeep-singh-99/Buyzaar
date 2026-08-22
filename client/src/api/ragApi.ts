import { useMutation, useQuery } from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";
import { toast } from "sonner";

export interface RAGSearchResult {
  product_id: string;
  content: string;
  metadata: {
    product_id: string;
    name: string;
    brand?: string;
    category?: string;
    price?: number;
    sales_price?: number;
    image_url?: string;
  };
  score: number;
}

export interface RAGSearchResponse {
  query: string;
  results: RAGSearchResult[];
}

export interface SyncResponse {
  message: string;
  total_synced: number;
}

// Fallback helper to call Recommendation Service directly if gateway routing is bypassed
const RECOMMENDATION_SERVICE_URL =
  import.meta.env.VITE_RECOMMENDATION_SERVICE_URL || "http://localhost:8003";

export const syncRagProductsApi = async (): Promise<SyncResponse> => {
  try {
    const response = await axiosClient.post("/api/rag/sync", null, { timeout: 120000 });
    return response.data;
  } catch (error) {
    // If gateway proxy route not active, attempt direct fallback
    const directResponse = await fetch(`${RECOMMENDATION_SERVICE_URL}/api/rag/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!directResponse.ok) {
      const errData = await directResponse.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to sync RAG embeddings");
    }
    return directResponse.json();
  }
};

export const searchRagProductsApi = async (
  query: string,
  top_k: number = 5
): Promise<RAGSearchResponse> => {
  try {
    const response = await axiosClient.post("/api/rag/search", { query, top_k });
    return response.data;
  } catch (error) {
    const directResponse = await fetch(`${RECOMMENDATION_SERVICE_URL}/api/rag/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k }),
    });
    if (!directResponse.ok) {
      const errData = await directResponse.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to search RAG products");
    }
    return directResponse.json();
  }
};

export const useSyncRagEmbeddings = () => {
  return useMutation<SyncResponse, Error, void>({
    mutationFn: syncRagProductsApi,
    onSuccess: (data) => {
      toast.success(
        `RAG Sync Complete! Synchronized ${data.total_synced} product embeddings.`
      );
    },
    onError: (error) => {
      toast.error(error.message || "RAG Sync failed. Ensure Recommendation Service is running.");
    },
  });
};

export interface ChatRecommendedProduct {
  product_id: string;
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  sales_price?: number;
  image_url?: string;
}

export interface ChatResponse {
  answer: string;
  products: ChatRecommendedProduct[];
  is_out_of_scope?: boolean;
}

export const chatRagApi = async (message: string): Promise<ChatResponse> => {
  try {
    const response = await axiosClient.post("/api/chat", { message });
    return response.data;
  } catch (error) {
    const directResponse = await fetch(`${RECOMMENDATION_SERVICE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!directResponse.ok) {
      const errData = await directResponse.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to generate AI recommendation");
    }
    return directResponse.json();
  }
};

export const useChatRag = () => {
  return useMutation<ChatResponse, Error, string>({
    mutationFn: chatRagApi,
    onError: (error) => {
      toast.error(error.message || "Failed to get AI recommendation");
    },
  });
};

export const useSearchRagProducts = (query: string, top_k: number = 5) => {
  return useQuery<RAGSearchResponse, Error>({
    queryKey: ["rag-search", query, top_k],
    queryFn: () => searchRagProductsApi(query, top_k),
    enabled: !!query.trim(),
    staleTime: 60 * 1000,
  });
};
