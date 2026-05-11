"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Bot, User, AlertCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: ChatMessage[];
  sessionId: string;
  isLoading: boolean;
  error: string | null;
}

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [state, setState] = useState<ChatState>({
    messages: [],
    sessionId: "",
    isLoading: false,
    error: null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useAuth();
  
  // Storage keys
  const getStorageKey = () => currentUser ? `chat_history_${currentUser.user_id}` : "chat_history_guest";
  const getSessionKey = () => currentUser ? `chat_session_${currentUser.user_id}` : "chat_session_guest";
  
  // Initialize state from localStorage (client-side only)
  useEffect(() => {
    const savedMessages = localStorage.getItem(getStorageKey());
    const savedSessionId = localStorage.getItem(getSessionKey());
    
    if (savedMessages || savedSessionId) {
      setState(prev => ({
        ...prev,
        messages: savedMessages ? JSON.parse(savedMessages) : [],
        sessionId: savedSessionId || "",
      }));
    }
  }, [currentUser]); // Re-load when user changes

  // Save to localStorage whenever messages or sessionId change
  useEffect(() => {
    if (state.messages.length > 0) {
      localStorage.setItem(getStorageKey(), JSON.stringify(state.messages));
    }
    if (state.sessionId) {
      localStorage.setItem(getSessionKey(), state.sessionId);
    }
  }, [state.messages, state.sessionId, currentUser]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || state.isLoading) return;

    // Add user message immediately
    const userMsg: ChatMessage = { role: "user", content: text };
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true,
      error: null,
    }));
    setInput("");

    try {
      const response = await api.post("/chat", {
        message: text,
        history: [...state.messages, userMsg].slice(-10), // Send last 10 messages
        session_id: state.sessionId,
        is_authenticated: !!currentUser,
        user_role: currentUser?.role || "",
      });

      const data = response.data;

      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { role: "assistant", content: data.response },
        ],
        sessionId: data.session_id || prev.sessionId,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error("Chat Error:", error);

      // Use fallback response from error if available
      const fallbackResponse =
        error.response?.data?.response ||
        "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";

      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { role: "assistant", content: fallbackResponse },
        ],
        isLoading: false,
        error: error.response?.status === 429
          ? "You're sending messages too quickly. Please wait a moment."
          : null,
      }));
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your chat history?")) {
      setState({
        messages: [],
        sessionId: "",
        isLoading: false,
        error: null,
      });
      localStorage.removeItem(getStorageKey());
      localStorage.removeItem(getSessionKey());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "How do I submit KYC verification?",
    "How do I list a property?",
    "How do I buy tokens?",
    "How does rent distribution work?",
    "What is the secondary exchange?",
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
          size="icon"
          id="chatbot-fab"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[400px] h-[560px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-5 duration-300 border-border/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Smart Sukuk Assistant</h3>
                <p className="text-[10px] opacity-80">
                  {currentUser ? "Personalized help" : "General assistance"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {state.messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearHistory}
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                  title="Clear history"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                id="chatbot-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {state.messages.length === 0 ? (
              <div className="py-4">
                <div className="text-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Hello! I&apos;m your Smart Sukuk assistant. Ask me anything about the platform.
                  </p>
                  {!currentUser && (
                    <p className="text-muted-foreground/70 text-xs mt-1">
                      Log in for personalized assistance
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium px-1">Quick questions:</p>
                  {quickActions.map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start text-xs h-auto py-2 px-3"
                      onClick={() => handleSend(action)}
                      disabled={state.isLoading}
                      id={`quick-action-${action.slice(0, 20).replace(/\s/g, '-')}`}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {state.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm shadow-sm"
                          : "bg-muted rounded-bl-sm border border-border/50 shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-headings:text-foreground prose-headings:font-bold prose-headings:mb-1 prose-headings:mt-2 first:prose-headings:mt-0 prose-ul:my-1 prose-li:my-0.5">
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => {
                                const isInternal = props.href?.startsWith("/");
                                if (isInternal) {
                                  return (
                                    <Link 
                                      href={props.href || "#"} 
                                      className="text-accent hover:underline font-medium transition-colors"
                                    >
                                      {props.children}
                                    </Link>
                                  );
                                }
                                return (
                                  <a 
                                    {...props} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline"
                                  />
                                );
                              },
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                        <User className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {state.isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-muted px-4 py-3 rounded-xl rounded-bl-sm">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Rate Limit Warning */}
            {state.error && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-background shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Smart Sukuk..."
                className="flex-1 text-sm"
                disabled={state.isLoading}
                id="chatbot-input"
              />
              <Button
                onClick={() => handleSend()}
                size="icon"
                className="shrink-0"
                disabled={state.isLoading || !input.trim()}
                id="chatbot-send"
              >
                {state.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
