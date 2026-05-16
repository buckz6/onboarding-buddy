import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, FileText, Coins } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ChatMessage = ({ message, onFileClick, files }) => {
  const isUser = message.role === 'user'
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(!isUser)

  // Typing animation for bot messages
  useEffect(() => {
    if (!isUser && message.content) {
      setIsTyping(true)
      setDisplayedText('')
      
      let currentIndex = 0
      const typingSpeed = 10 // milliseconds per character
      
      const timer = setInterval(() => {
        if (currentIndex < message.content.length) {
          setDisplayedText(message.content.substring(0, currentIndex + 1))
          currentIndex++
        } else {
          setIsTyping(false)
          clearInterval(timer)
        }
      }, typingSpeed)
      
      return () => clearInterval(timer)
    } else {
      setDisplayedText(message.content)
      setIsTyping(false)
    }
  }, [message.content, isUser])

  const handleFileChipClick = (filePath) => {
    // Find the file object from the files array
    const file = files.find(f => f.path === filePath)
    if (file && onFileClick) {
      onFileClick(file)
    }
  }
  
  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'bg-surface' : 'bg-background'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary' : 'bg-secondary'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-300">
            {isUser ? 'You' : 'Bob AI'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="text-sm text-gray-200 whitespace-pre-wrap break-words">
          {displayedText}
          {isTyping && <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse"></span>}
        </div>
        
        {/* File Reference Chips */}
        {!isUser && message.referenced_files && message.referenced_files.length > 0 && !isTyping && (
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="text-xs text-gray-400 w-full mb-1">📎 Referenced files:</div>
            {message.referenced_files.map((filePath, index) => (
              <button
                key={index}
                onClick={() => handleFileChipClick(filePath)}
                className="px-2 py-1 bg-surface-light hover:bg-primary/20 border border-surface-light hover:border-primary rounded text-xs text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                title={`Click to view ${filePath}`}
              >
                <FileText className="w-3 h-3" />
                {filePath.split('/').pop()}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const ChatPanel = ({ messages, onSendMessage, repoPath, onFileClick, files }) => {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!inputValue.trim() || isSending) return

    const message = inputValue.trim()
    setInputValue('')
    setIsSending(true)

    try {
      await onSendMessage(message)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Calculate estimated Bobcoins usage
  const estimateCoins = (text) => {
    // Mock calculation: ~0.1 coins per 100 characters
    const chars = text.length
    return (chars / 1000).toFixed(2)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-surface-light">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-secondary" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-gray-300">AI Assistant</h2>
            <p className="text-xs text-gray-500">Powered by IBM Bob</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-gray-400">Bobcoins</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
            <Bot className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm font-medium mb-2">Start a conversation</p>
            <p className="text-xs">
              Ask me anything about the codebase, and I'll help you understand it better.
            </p>
            <div className="mt-6 space-y-2 text-left w-full max-w-xs">
              <p className="text-xs font-semibold text-gray-400 uppercase">Example questions:</p>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">• What does this project do?</p>
                <p className="text-xs text-gray-500">• How is authentication implemented?</p>
                <p className="text-xs text-gray-500">• Where is the API defined?</p>
                <p className="text-xs text-gray-500">• Why was this pattern used?</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message, index) => (
              <ChatMessage 
                key={index} 
                message={message}
                onFileClick={onFileClick}
                files={files}
              />
            ))}
            {isSending && (
              <div className="flex gap-3 p-4 bg-background">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-secondary">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-300">Bob AI</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing codebase...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-surface-light p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about the code..."
            className="flex-1 px-3 py-2 bg-background border border-surface-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500 resize-none"
            rows="3"
            disabled={isSending || !repoPath}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending || !repoPath}
            className="px-4 py-2 bg-primary hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors self-end"
            title={!repoPath ? "Please analyze a repository first" : "Send message"}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </p>
          {inputValue && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Coins className="w-3 h-3 text-yellow-400" />
              <span>~{estimateCoins(inputValue)} coins</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPanel

// Made with Bob
