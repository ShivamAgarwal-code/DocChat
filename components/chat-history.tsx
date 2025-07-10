"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { History, Trash2, MessageSquare, Clock } from "lucide-react"

interface ChatHistoryProps {
  onChatSelect: (chat: any[]) => void
}

export function ChatHistory({ onChatSelect }: ChatHistoryProps) {
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")
    setHistory(savedHistory)
  }, [])

  const clearHistory = () => {
    localStorage.removeItem("chatHistory")
    setHistory([])
  }

  // Group messages into conversations
  const groupedConversations = history.reduce((acc, message, index) => {
    if (message.role === "user") {
      const nextMessage = history[index + 1]
      if (nextMessage && nextMessage.role === "assistant") {
        acc.push([message, nextMessage])
      }
    }
    return acc
  }, [] as any[][])

  const handleChatClick = (conversation: any[]) => {
    onChatSelect(conversation)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <History className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Chat History</h3>
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="h-[400px]">
        {groupedConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">No chat history yet</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Start chatting with documents to see your conversation history here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-3 w-3 text-gray-400" />
              <h4 className="text-xs font-medium text-gray-500">Recent Conversations</h4>
            </div>
            <div className="space-y-3">
              {groupedConversations
                .slice(-10)
                .reverse()
                .map((conversation, index) => (
                  <Card
                    key={index}
                    className="p-3 max-w-[17rem] w-full hover:bg-gray-50/80 cursor-pointer transition-all duration-200 bg-white/60 border-gray-200/50"
                    onClick={() => handleChatClick(conversation)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 line-clamp-2 leading-relaxed mb-2">
                          {conversation[0].content.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-500 font-medium">Click to restore chat</p>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
