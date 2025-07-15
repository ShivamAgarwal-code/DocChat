"use client"

import { useState } from "react"
import { DocumentViewer } from "@/components/document-viewer"
import { ChatPanel } from "@/components/chat-panel"
import { DocumentInput } from "@/components/document-input"
import { ChatHistory } from "@/components/chat-history"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function Home() {
  const [documentUrl, setDocumentUrl] = useState<string>("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentDocument, setCurrentDocument] = useState<{
    url: string
    name: string
    type: string
    content?: string
    metadata?: any
  } | null>(null)
  const [currentChat, setCurrentChat] = useState<any[]>([])
  const [selectedText, setSelectedText] = useState<string>("")

  const handleDocumentLoad = (url: string, name: string, type: string, data: any) => {
    setDocumentUrl(url)
    setCurrentDocument({
      url,
      name,
      type,
      content: data.content,
      metadata: data.metadata,
    })
    // Clear current chat when new document is loaded
    setCurrentChat([])
    setSelectedText("")
  }

  const handleChatSelect = (chat: any[]) => {
    setCurrentChat(chat)
  }

  const handleTextSelection = (text: string) => {
    setSelectedText(text)
  }

  const handleClearSelection = () => {
    setSelectedText("")
    // Clear browser selection
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header setOpen={setIsSidebarOpen} isOpen={isSidebarOpen} />

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)}>
          <div className="space-y-8">
            <DocumentInput onDocumentLoad={handleDocumentLoad} />
            <ChatHistory onChatSelect={handleChatSelect} />
          </div>
        </Sidebar>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Document Viewer */}
          <div className="flex-1 bg-white/70 backdrop-blur-sm border-r border-gray-200/50 shadow-sm">
            {documentUrl ? (
              <DocumentViewer
                documentUrl={documentUrl}
                documentType={currentDocument?.type || "pdf"}
                onTextSelection={handleTextSelection}
                selectedText={selectedText}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md mx-auto p-8">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center shadow-lg">
                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to analyze</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Enter a document URL in the sidebar to start chatting with your PDF, Word, or Excel files using AI
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="w-96 bg-white/70 backdrop-blur-sm shadow-lg">
            <ChatPanel
              documentUrl={documentUrl}
              currentDocument={currentDocument}
              currentChat={currentChat}
              onChatUpdate={setCurrentChat}
              documentData={currentDocument?.content}
              selectedText={selectedText}
              onClearSelection={handleClearSelection}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-80 bg-white/90 backdrop-blur-md shadow-xl">
              <Sidebar isOpen={true} onToggle={() => setIsSidebarOpen(false)}>
                <div className="space-y-8">
                  <DocumentInput onDocumentLoad={handleDocumentLoad} />
                  <ChatHistory onChatSelect={handleChatSelect} />
                </div>
              </Sidebar>
            </div>
          </div>
        )}

        {documentUrl ? (
          /* Mobile Document + Chat Layout */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Document Viewer - Takes 60% of screen */}
            <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/50 shadow-sm overflow-auto">
              <DocumentViewer
                documentUrl={documentUrl}
                documentType={currentDocument?.type || "pdf"}
                onTextSelection={handleTextSelection}
                selectedText={selectedText}
              />
            </div>
            {/* Chat Panel - Takes 40% of screen */}
            <div className="h-[39vh] bg-white/70 backdrop-blur-sm shadow-lg">
              <ChatPanel
                documentUrl={documentUrl}
                currentDocument={currentDocument}
                currentChat={currentChat}
                onChatUpdate={setCurrentChat}
                documentData={currentDocument?.content}
                selectedText={selectedText}
                onClearSelection={handleClearSelection}
              />
            </div>
          </div>
        ) : (
          /* Mobile Empty State */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to analyze</h3>
              <p className="text-gray-600 leading-relaxed text-sm mb-4">
                Tap "Document Tools" to load a PDF, Word, or Excel file and start chatting with AI
              </p>
              <Button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Menu className="h-4 w-4 mr-2" />
                Open Document Tools
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
