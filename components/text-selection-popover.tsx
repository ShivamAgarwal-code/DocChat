import React from "react";
import { Button } from "./ui/button";
import { FileText, Lightbulb, X } from "lucide-react";

interface TextSelectionPopoverProps {
  position: { x: number; y: number };
  selectedText: string;
  onAction: (action: "summarize" | "explain") => void;
  onClose: () => void;
}

export function TextSelectionPopover({
  position,
  selectedText,
  onAction,
  onClose,
}: TextSelectionPopoverProps) {
  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px] animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translateX(-50%)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">
          Text Selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600 max-h-16 overflow-y-auto">
        {selectedText.length > 100 
          ? `${selectedText.substring(0, 100)}...` 
          : selectedText
        }
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onAction("summarize")}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="h-3 w-3 mr-1" />
          Summarize
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("explain")}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          <Lightbulb className="h-3 w-3 mr-1" />
          Explain
        </Button>
      </div>
    </div>
  );
}