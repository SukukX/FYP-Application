"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Mic, Send } from "lucide-react";
import { storage } from "@/lib/mockData";
import { useAuth } from "@/context/auth-context";

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const { user: currentUser } = useAuth();

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { role: "user" as const, text: input };
    setMessages((prev) => [...prev, userMsg]);

    // Simple demo responses
    let botResponse = "";
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("portfolio") || lowerInput.includes("performance")) {
      if (currentUser && currentUser.role === "investor") {
        const portfolio = storage.getPortfolio(currentUser.user_id.toString());
        botResponse = portfolio.length > 0
          ? `You have ${portfolio.length} holdings. Would you like to view your portfolio dashboard?`
          : "You don't have any holdings yet. Browse our marketplace to start investing!";
      } else {
        botResponse = "Please log in as an investor to view your portfolio.";
      }
    } else if (lowerInput.includes("kyc") || lowerInput.includes("verification")) {
      if (currentUser) {
        if (currentUser.kycStatus === "verified") {
          botResponse = "Your KYC is verified! You can now trade tokens.";
        } else {
          botResponse = "Your KYC verification is pending. Please complete the verification process in your dashboard.";
        }
      } else {
        botResponse = "Please log in to check your KYC status.";
      }
    } else if (lowerInput.includes("marketplace") || lowerInput.includes("browse")) {
      botResponse = "I can help you browse our marketplace! We have several verified properties available for tokenized investment.";
    } else if (lowerInput.includes("list") || lowerInput.includes("property")) {
      botResponse = "To list your property, log in as an owner and navigate to your dashboard. You'll need to complete KYC verification first.";
    } else {
      botResponse = "I'm here to help! You can ask me about:\n• Your portfolio performance\n• KYC verification\n• Browsing the marketplace\n• Listing a property";
    }

    setMessages((prev) => [...prev, { role: "bot", text: botResponse }]);
    setInput("");
  };

  const quickActions = [
    "Show my portfolio performance",
    "Complete KYC verification",
    "Browse marketplace",
  ];

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col animate-scale-in">
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Smart Sukuk Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Hello! I'm your Smart Sukuk assistant. How can I help you today?
                </p>
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start"
                      onClick={() => {
                        setInput(action);
                        handleSend();
                      }}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t flex gap-2">
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon" className="flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
