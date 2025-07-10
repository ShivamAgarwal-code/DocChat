"use client";
import { Button } from "@/components/ui/button";
import { FileText, Menu, Sparkles } from "lucide-react";

export function Header({setOpen,isOpen}) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="px-4 md:px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              {/* <FileText className="h-5 w-5 text-white" /> */}
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                DocChat AI
              </h1>
              <p className="text-[9px] md:text-sm text-gray-500">
                Analyze and chat with your documents using AI
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 backdrop-blur-md"
          >
            <Menu className="h-8 w-8 text-white" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden lg:flex bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:inline">AI Powered</span>
            <span className="md:hidden">AI Powered</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
