"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Sparkles, MessageSquare, Zap } from "lucide-react";

interface ChatPanelProps {
  documentUrl: string;
  selectedText: string;
  onClearSelection: () => void;
  currentDocument: {
    data: any;
    url: string;
    name: string;
    type: string;
  } | null;
  currentChat: any[];
  onChatUpdate: (chat: any[]) => void;
  documentData: any;
}

export function ChatPanel({
  documentUrl,
  selectedText,
  onClearSelection,
  currentDocument,
  currentChat,
  onChatUpdate,
  documentData,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize messages when document loads or chat is selected
  useEffect(() => {
    console.log("====================================");
    console.log(documentData, "document data");
    console.log("====================================");

    console.log("====================================");
    console.log(currentDocument, "current document");
    console.log("====================================");
    if (currentChat.length > 0) {
      setMessages(currentChat);
    } else if (documentUrl && currentDocument) {
      const systemMessage = {
        id: "system",
        role: "system",
        content: `You are an AI assistant helping users understand and analyze documents. The current document is: ${
          currentDocument.name
        } (${currentDocument.type.toUpperCase()}) from URL: ${documentUrl}.
Here is the extracted document content:
${currentDocument.data?.slice(0, 4000) || "No content available."}

Please provide helpful, accurate responses about the document content.`,
      };
      setMessages([systemMessage]);
    } else {
      setMessages([]);
    }
  }, [documentUrl, currentDocument, currentChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Handle text selection actions
  useEffect(() => {
    const handleTextAction = (event: CustomEvent) => {
      const { action, text } = event.detail;
      let prompt = "";
      if (text.trim().split(/\s+/).length <= 3) {
        prompt = `Please explain what the word or phrase "${text}" means in the context of this document.`;
      } else if (action === "summarize") {
        prompt = `Please summarize the following text from the document: "${text}"`;
      } else if (action === "explain") {
        prompt = `Please explain the following text from the document in simple terms: "${text}"`;
      }
      if (prompt) {
        setInput(prompt);
        setTimeout(() => {
          handleSubmit(prompt);
        }, 100);
      }
    };

    window.addEventListener("textAction", handleTextAction as EventListener);
    return () => {
      window.removeEventListener(
        "textAction",
        handleTextAction as EventListener
      );
    };
  }, []);

  const callOpenAI = async (messages: any[]) => {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: messages
              .filter((m) => m.role !== "system" || m.id === "system")
              .map((m) => ({
                role: m.role,
                content: m.content,
              })),
            max_tokens: 1000,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API Error:", error);
      return "I'm sorry, I encountered an error while processing your request. Please try again.";
    }
  };

  const handleSubmit = async (customInput?: string) => {
    const messageText = customInput || input.trim();
    if (!messageText || !documentUrl || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const aiResponse = await callOpenAI(newMessages);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      onChatUpdate(finalMessages);

      // Save to chat history
      const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
      const updatedHistory = [...history, userMessage, assistantMessage];
      localStorage.setItem(
        "chatHistory",
        JSON.stringify(updatedHistory.slice(-50))
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      label: "Summarize Document",
      prompt: "Please provide a comprehensive summary of this document.",
      icon: Sparkles,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Key Points",
      prompt: "What are the main key points and takeaways from this document?",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Ask Questions",
      prompt:
        "What questions should I ask about this document to better understand it?",
      icon: MessageSquare,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const handleQuickAction = (prompt: string, documentData: any) => {
    // Create an enhanced prompt that includes the document data
    const enhancedPrompt = `${prompt} Based on the following document content:
${documentData || "No document content available."}`;

    setInput(enhancedPrompt);
    handleSubmit(enhancedPrompt);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            {documentUrl && (
              <p className="text-xs text-gray-500">
                Ready to analyze your document
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {documentUrl &&
        messages.filter((m) => m.role !== "system").length === 0 && (
          <div className="p-4 hidden lg:inline-block md:p-6 border-b border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-white/50">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              Quick Actions
            </h4>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-3 bg-white/60 hover:bg-white/80 border-gray-200/50 hover:border-gray-300 transition-all duration-200 group"
                  onClick={() =>
                    handleQuickAction(
                      action.prompt,
                      currentDocument?.data?.slice(0, 4000)
                    )
                  }
                >
                  <div
                    className={`w-6 h-6 rounded-md bg-gradient-to-r ${action.color} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200`}
                  >
                    <action.icon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

      {/* Messages */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        <div className="space-y-4 md:space-y-6">
          {messages
            .filter((m) => m.role !== "system")
            .map((message) => {
              const isUser = message.role === "user";

              return isUser ? (
                // ✅ User Message
                <div key={message.id} className="flex justify-end">
                  <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 p-3 md:p-4 shadow-md max-w-[55vw] lg:max-w-[18vw] w-fit break-words overflow-wrap-break-word">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                // ✅ Assistant Message
                <div key={message.id} className="flex justify-start ">
                  <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-3 md:p-4 shadow-sm max-w-[55vw] lg:max-w-[18vw] w-fit">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selected Text Preview */}
      {selectedText && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-200/50">
          <div className="text-xs font-medium text-blue-700 mb-2">
            Selected text:
          </div>
          <div className="text-sm text-blue-900 bg-white/80 p-3 rounded-lg border border-blue-200/50 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
            "{selectedText.substring(0, 200)}..."
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex space-x-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              documentUrl
                ? "Ask about the document..."
                : "Load a document to start chatting..."
            }
            disabled={!documentUrl || isLoading}
            className="flex-1 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
          />
          <Button
            type="submit"
            disabled={!input.trim() || !documentUrl || isLoading}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
