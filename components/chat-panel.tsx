"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Send, Bot, User, Sparkles, MessageSquare, Zap, AlertCircle } from "lucide-react"

interface ChatPanelProps {
  documentUrl: string
  currentDocument: {
    content?: string
    metadata?: any
    url: string
    name: string
    type: string
  } | null
  currentChat: any[]
  onChatUpdate: (chat: any[]) => void
  documentData: any
  selectedText?: string
  onClearSelection?: () => void
}

export function ChatPanel({
  documentUrl,
  currentDocument,
  currentChat,
  onChatUpdate,
  documentData,
  selectedText,
  onClearSelection,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Initialize messages when document loads or chat is selected
  useEffect(() => {
    if (currentChat.length > 0) {
      setMessages(currentChat)
    } else if (documentUrl && currentDocument) {
      const welcomeMessage = {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm ready to help you analyze your document. You can ask me questions about the document content, request summaries, or get explanations about specific parts.`,
      }
      setMessages([welcomeMessage])
    } else {
      setMessages([])
    }
  }, [documentUrl, currentDocument, currentChat])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const callChatAPI = async (messages: any[], selectedText?: string, action?: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          documentData: currentDocument?.content,
          selectedText,
          action,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to get AI response")
      }

      return data.message
    } catch (error) {
      console.error("Chat API Error:", error)
      throw error
    }
  }

  const handleSubmit = async (customInput?: string, action?: string) => {
    const messageText = customInput || input.trim()
    if (!messageText || !documentUrl || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const aiResponse = await callChatAPI(newMessages, selectedText, action)

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)
      onChatUpdate(finalMessages)

      // Clear selected text after processing
      if (selectedText && onClearSelection) {
        onClearSelection()
      }

      // Save to chat history
      try {
        const history = JSON.parse(localStorage.getItem("chatHistory") || "[]")
        const updatedHistory = [...history, userMessage, assistantMessage]
        localStorage.setItem("chatHistory", JSON.stringify(updatedHistory.slice(-50)))
      } catch (e) {
        console.warn("Failed to save chat history:", e)
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Failed to get AI response")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextAction = (action: "summarize" | "explain") => {
    if (!selectedText) return

    const actionPrompts = {
      summarize: `Please summarize this selected text: "${selectedText}"`,
      explain: `Please explain this selected text in detail: "${selectedText}"`,
    }

    handleSubmit(actionPrompts[action], action)
  }

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
      prompt: "What questions should I ask about this document to better understand it?",
      icon: MessageSquare,
      color: "from-purple-500 to-pink-500",
    },
  ]

  const handleQuickAction = (prompt: string) => {
    handleSubmit(prompt)
  }

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
            {documentUrl && <p className="text-xs text-gray-500">Ready to analyze your document</p>}
          </div>
        </div>
      </div>

      {/* Selected Text Actions */}
      {selectedText && (
        <div className="p-4 border-b border-gray-200/50 bg-blue-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Text Selected</span>
            {onClearSelection && (
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                Clear
              </Button>
            )}
          </div>
          <div className="text-xs text-gray-600 mb-3 p-2 bg-white rounded border max-h-16 overflow-y-auto">
            {selectedText.length > 150 ? `${selectedText.substring(0, 150)}...` : selectedText}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleTextAction("summarize")}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Summarize
            </Button>
            <Button
              size="sm"
              onClick={() => handleTextAction("explain")}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Explain
            </Button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {documentUrl &&
        messages.filter((m) => m.role !== "system" && m.id !== "welcome").length === 0 &&
        !selectedText && (
          <div className="p-4 hidden lg:block md:p-6 border-b border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-white/50">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h4>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-3 bg-white/60 hover:bg-white/80 border-gray-200/50 hover:border-gray-300 transition-all duration-200 group"
                  onClick={() => handleQuickAction(action.prompt)}
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

      {/* Error Display */}
      {error && (
        <div className="p-4 border-b border-red-200/50 bg-red-50/50">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        <div className="space-y-4 md:space-y-6">
          {messages.map((message) => {
            const isUser = message.role === "user"
            return isUser ? (
              // User Message
              <div key={message.id} className="flex justify-end">
                <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 p-3 md:p-4 shadow-md max-w-[55vw] lg:max-w-[20vw] w-fit break-words overflow-wrap-break-word">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
                  </div>
                </Card>
              </div>
            ) : (
              // Assistant Message
              <div key={message.id} className="flex justify-start">
                <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-3 md:p-4 shadow-sm max-w-[55vw] lg:max-w-[18vw] w-fit">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
                  </div>
                </Card>
              </div>
            )
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

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="flex space-x-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              documentUrl
                ? selectedText
                  ? "Ask about the selected text..."
                  : "Ask about the document..."
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
  )
}
