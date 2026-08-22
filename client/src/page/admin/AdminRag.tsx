import React, { useState, useEffect } from "react";
import {
  Sparkles,
  RefreshCw,
  Database,
  Cpu,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGetTotalProducts } from "@/api/productApi";
import { useSyncRagEmbeddings, searchRagProductsApi } from "@/api/ragApi";
import type { RAGSearchResult } from "@/api/ragApi";
import { RagPageSkeleton } from "@/components/skeleton/RagPageSkeleton";
import { toast } from "sonner";

export default function AdminRag() {
  const { data: totalProductsData, isLoading: isTotalLoading } = useGetTotalProducts();
  const syncMutation = useSyncRagEmbeddings();

  // Progress state for sync animation
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncStepText, setSyncStepText] = useState<string>("");

  // RAG Search Tester State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<RAGSearchResult[]>([]);
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string>("");

  // Handle Sync progress simulation during active mutation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (syncMutation.isPending) {
      setSyncProgress(10);
      setSyncStepText("Connecting to Product Service...");

      interval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev < 40) {
            setSyncStepText("Fetching complete product catalog from Product Service...");
            return prev + 10;
          } else if (prev < 75) {
            setSyncStepText("Generating 384D HuggingFace vector embeddings...");
            return prev + 8;
          } else if (prev < 92) {
            setSyncStepText("Upserting pgvector database records...");
            return prev + 4;
          }
          return prev;
        });
      }, 400);
    } else if (syncMutation.isSuccess) {
      setSyncProgress(100);
      setSyncStepText("Synchronization successfully completed!");
    } else if (syncMutation.isError) {
      setSyncProgress(0);
      setSyncStepText("Synchronization failed.");
    }

    return () => clearInterval(interval);
  }, [syncMutation.isPending, syncMutation.isSuccess, syncMutation.isError]);

  const handleStartSync = () => {
    setSyncProgress(5);
    syncMutation.mutate();
  };

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await searchRagProductsApi(searchQuery.trim(), 5);
      setSearchResults(response.results || []);
      setLastSearchedQuery(searchQuery.trim());
      toast.success(`Retrieved ${response.results?.length || 0} RAG matches`);
    } catch (err: any) {
      toast.error(err.message || "Failed to execute vector search");
    } finally {
      setIsSearching(false);
    }
  };

  if (isTotalLoading) {
    return <RagPageSkeleton />;
  }

  const totalCount = totalProductsData?.total_products ?? 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            RAG & AI Embeddings Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage vector embeddings, monitor RAG search quality, and synchronize product data for Groq AI Recommendations.
          </p>
        </div>
        <Button
          onClick={handleStartSync}
          disabled={syncMutation.isPending}
          className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 text-white shadow-md transition-all"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Synchronizing..." : "Sync RAG Embeddings"}
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Product Catalog</CardTitle>
            <Layers className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total products in database</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Embedding Model</CardTitle>
            <Cpu className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold truncate">all-MiniLM-L6-v2</div>
            <p className="text-xs text-muted-foreground mt-1">HuggingFace Sentence-Transformers</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vector Dimension</CardTitle>
            <Database className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">384-D</div>
            <p className="text-xs text-muted-foreground mt-1">PostgreSQL pgvector cosine distance</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RAG Engine Status</CardTitle>
            <Bot className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                Active & Ready
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Inngest real-time sync active</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Action & Progress Card */}
      <Card className="border-primary/20 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <RefreshCw className="h-5 w-5 text-primary" />
            Full RAG Synchronization
          </CardTitle>
          <CardDescription>
            Clicking the sync button will fetch all current products from Product Service, convert specifications into searchable content, and update pgvector embeddings in PostgreSQL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {syncMutation.isPending
                ? "Synchronization in progress..."
                : syncMutation.isSuccess
                ? "Synchronization finished!"
                : "Ready to synchronize"}
            </span>
            <span className="text-sm font-bold">{syncProgress}%</span>
          </div>

          <Progress value={syncProgress} className="h-3" />

          {syncStepText && (
            <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
              {syncMutation.isPending && <RefreshCw className="h-3 w-3 animate-spin text-primary" />}
              {syncMutation.isSuccess && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              {syncMutation.isError && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
              {syncStepText}
            </p>
          )}

          {syncMutation.isSuccess && (
            <Alert className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <PackageCheck className="h-4 w-4" />
              <AlertTitle>Synchronization Complete</AlertTitle>
              <AlertDescription>
                Successfully synchronized {syncMutation.data?.total_synced ?? totalCount} product embeddings. All AI recommendations are up to date!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Interactive Vector Search Inspector */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 text-violet-500" />
            Live Vector Search & Content Inspector
          </CardTitle>
          <CardDescription>
            Test cosine vector similarity search against your PostgreSQL pgvector database to inspect how products match semantic queries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleTestSearch} className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Samsung phone under 50000 for gaming..."
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Test Vector Search
            </Button>
          </form>

          {/* Results List */}
          {searchResults.length > 0 ? (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Search Query: "{lastSearchedQuery}"</span>
                <span>Found {searchResults.length} matches</span>
              </div>
              {searchResults.map((result, idx) => (
                <div
                  key={result.product_id || idx}
                  className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors space-y-2"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        #{idx + 1}
                      </Badge>
                      <h4 className="font-semibold text-base">
                        {result.metadata?.name || "Product " + result.product_id}
                      </h4>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                      Similarity Score: {(result.score * 100).toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground pt-1">
                    <div>
                      <span className="font-semibold text-foreground">Brand:</span> {result.metadata?.brand || "N/A"}
                      <span className="mx-2">•</span>
                      <span className="font-semibold text-foreground">Category:</span> {result.metadata?.category || "N/A"}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Sale Price:</span> ₹
                      {result.metadata?.sales_price ?? result.metadata?.price ?? "N/A"}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded text-xs font-mono whitespace-pre-wrap max-h-36 overflow-y-auto text-foreground/80">
                    {result.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            lastSearchedQuery && (
              <p className="text-center py-6 text-sm text-muted-foreground">
                No matching product embeddings found for "{lastSearchedQuery}". Try running RAG synchronization!
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
