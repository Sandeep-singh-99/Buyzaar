import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChatRag } from "@/api/ragApi";
import type { ChatRecommendedProduct } from "@/api/ragApi";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  products?: ChatRecommendedProduct[];
  is_out_of_scope?: boolean;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Suggest a mobile phone under 10000",
  "Samsung phone for gaming under 50000",
  "Best laptops for coding and work",
  "Wireless noise cancelling earbuds",
];

export function AiChatSection() {
  const navigate = useNavigate();
  const chatMutation = useChatRag();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "ai",
      text: "Hello! I am Buyzaar's AI Shopping Assistant powered by Groq LLM & RAG vector search. Ask me for product recommendations, budget options, or comparison advice!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || chatMutation.isPending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");

    chatMutation.mutate(text.trim(), {
      onSuccess: (data) => {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.answer,
          products: data.products,
          is_out_of_scope: data.is_out_of_scope || data.answer.includes("⚠️"),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      },
    });
  };

  const handleProductClick = (productId: string) => {
    if (productId) {
      navigate(`/products/${productId}`);
    }
  };

  return (
    <Card className="w-full border-primary/20 bg-card shadow-lg rounded-3xl overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-500 to-primary flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                Buyzaar Groq AI Product Assistant
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                  RAG Powered
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-0.5">
                Ask for product recommendations, budget choices, or specification comparisons.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Suggested Prompts:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={chatMutation.isPending}
              className="text-xs py-1 px-3 rounded-full bg-secondary/80 hover:bg-primary/20 hover:text-primary border border-border/60 transition-all text-left truncate max-w-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Message Box */}
        <div className="h-[420px] overflow-y-auto pr-2 space-y-4 rounded-2xl bg-slate-50 dark:bg-card/40 p-4 border border-border/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : msg.is_out_of_scope
                    ? "bg-amber-500 text-white"
                    : "bg-violet-600 text-white"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="h-4 w-4" />
                ) : msg.is_out_of_scope ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Bubble & Products */}
              <div className={`max-w-[85%] space-y-3 ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                {msg.is_out_of_scope && (
                  <div className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-semibold">
                    <AlertTriangle className="h-3 w-3" /> Out of Catalog Scope
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                      : msg.is_out_of_scope
                      ? "bg-amber-500/10 border border-amber-500/30 text-foreground rounded-tl-none shadow-sm"
                      : "bg-card border border-border/80 text-foreground rounded-tl-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[10px] opacity-70 block text-right mt-1">{msg.timestamp}</span>
                </div>

                {/* Recommended Products Grid */}
                {msg.products && msg.products.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <ShoppingBag className="h-3.5 w-3.5 text-primary" /> Recommended Products ({msg.products.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {msg.products.map((prod) => (
                        <div
                          key={prod.product_id}
                          onClick={() => handleProductClick(prod.product_id)}
                          className="group relative p-3 border rounded-xl bg-card hover:border-primary/60 hover:shadow-md transition-all cursor-pointer flex gap-3 items-center"
                        >
                          <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/50">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                                <ShoppingBag className="h-6 w-6" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                              {prod.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-0.5">
                              {prod.category && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {prod.category}
                                </Badge>
                              )}
                              {prod.brand && (
                                <span className="text-[10px] text-muted-foreground truncate">{prod.brand}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-bold text-sm text-primary">
                                ₹{prod.sales_price ?? prod.price ?? "N/A"}
                              </span>
                              {prod.sales_price && prod.price && prod.sales_price < prod.price && (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  ₹{prod.price}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-primary">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {chatMutation.isPending && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/80 text-sm flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                Searching pgvector database and generating Groq AI recommendations...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask AI e.g. Suggest mobile under 10000 or gaming laptop..."
            disabled={chatMutation.isPending}
            className="flex-1 rounded-full px-5 py-6 text-sm"
          />
          <Button
            type="submit"
            disabled={chatMutation.isPending || !inputMessage.trim()}
            className="rounded-full w-12 h-12 p-0 shrink-0 shadow-md"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
