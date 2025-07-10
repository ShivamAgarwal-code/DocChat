"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, MessageCircle, X } from "lucide-react"

interface TextSelectionPopoverProps {
  position: { x: number; y: number }
  selectedText: string
  onClose: () => void
}

export function TextSelectionPopover({ position, selectedText, onClose }: TextSelectionPopoverProps) {
  const handleAction = (action: "summarize" | "explain") => {
    const event = new CustomEvent("textAction", {
      detail: { action, text: selectedText },
    })
    window.dispatchEvent(event)
    onClose()
  }

  return (
    <Card
      className="fixed z-50 bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-xl p-2"
      style={{
        left: Math.max(10, Math.min(position.x - 100, window.innerWidth - 210)),
        top: Math.max(10, position.y - 60),
      }}
    >
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction("summarize")}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Summarize
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction("explain")}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Explain
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  )
}
