"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ children, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          "bg-white/80 backdrop-blur-md max-sm:z-50 border-r border-gray-200/50 transition-all duration-300 ease-in-out shadow-sm",
          isOpen ? "w-80" : "w-0",
        )}
      >
        <div className={cn("h-full overflow-hidden", isOpen ? "opacity-100" : "opacity-0")}>
          <div className="py-6 px-4 h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Document Tools
              </h2>
              <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0 hover:bg-gray-100/80">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            {children}
          </div>
        </div>
      </div>

      {!isOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="absolute left-4 top-24 z-10 h-10 w-10 p-0 bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:bg-white/95 hover:shadow-xl transition-all duration-200"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </>
  )
}
