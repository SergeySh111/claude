import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";
import type { CanonicalAnalyticsSnapshot, AiFilters, AiAnalyzeRequest, AiAnalyzeResponse } from "@shared/ai";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  analytics: CanonicalAnalyticsSnapshot | null;
  filters: AiFilters;
}

export function AIChatSidebar({ isOpen, onClose, onOpenSettings, analytics, filters }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!analytics) {
      const errorMessage: Message = {
        role: "assistant",
        content: "❌ **Error:** No analytics data available. Please upload CSV files first.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const requestBody: AiAnalyzeRequest = {
        question,
        filters,
        analytics,
      };

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as AiAnalyzeResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.ok === false ? data.error : "Failed to get response from AI");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answerMarkdown,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ **Error:** ${error.message || "Failed to get response from AI."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-[350px] h-screen bg-white border-l border-slate-200 flex flex-col shadow-xl sticky top-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">AI Analyst</h3>
            <p className="text-xs text-slate-500">Ask about your data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:bg-white/50 rounded-md transition-colors"
            title="Settings"
          >
            <Settings size={16} className="text-slate-600" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/50 rounded-md transition-colors"
            title="Close"
          >
            <X size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Bot size={32} className="text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">AI Analyst Ready</h4>
            <p className="text-sm text-slate-500 mb-4">
              Ask questions about your campaign performance, trends, or get recommendations.
            </p>
            <div className="space-y-2 text-left">
              <button
                onClick={() => setInput("What are the key trends this week?")}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-slate-700"
              >
                💡 What are the key trends this week?
              </button>
              <button
                onClick={() => setInput("Which campaigns should I scale?")}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-slate-700"
              >
                📈 Which campaigns should I scale?
              </button>
              <button
                onClick={() => setInput("Show me underperforming campaigns")}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-slate-700"
              >
                🚨 Show me underperforming campaigns
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900">
                  <Streamdown>{msg.content}</Streamdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
              <p
                className={`text-xs mt-1 ${
                  msg.role === "user" ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg p-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span className="text-sm text-slate-600">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-none p-4 border-t border-slate-200 bg-slate-50">
        {!analytics && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
            ⚠️ Please upload CSV files to enable AI analysis.
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your campaigns..."
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="self-end"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
