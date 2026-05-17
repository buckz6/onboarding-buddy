import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, FileText, Coins, Trash2 } from 'lucide-react'

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
    <div className={isUser ? 'msg-user' : 'msg-bot'} style={{ 
      display: 'flex', 
      gap: '12px', 
      padding: '12px',
      background: isUser ? '#0F1117' : '#161B22',
      borderRadius: 0,
      maxWidth: '100%',
      alignSelf: 'stretch'
    }}>
      <div style={{ 
        flexShrink: 0, 
        width: '28px', 
        height: '28px', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: isUser ? '#1F6FEB' : '#21262D',
        border: isUser ? 'none' : '1px solid #30363D'
      }}>
        {isUser ? (
          <User style={{ width: '16px', height: '16px', color: 'white' }} />
        ) : (
          <Bot style={{ width: '16px', height: '16px', color: '#58A6FF' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#8B949E' }}>
            {isUser ? 'You' : 'Bob AI'}
          </span>
          <span style={{ fontSize: '11px', color: '#6E7681' }}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div style={{ fontSize: '13px', color: '#C9D1D9', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
          {displayedText}
          {isTyping && <span style={{ display: 'inline-block', width: '4px', height: '16px', background: '#58A6FF', marginLeft: '4px', animation: 'pulse 1s infinite' }}></span>}
        </div>
        
        {/* File Reference Chips */}
        {!isUser && message.referenced_files && message.referenced_files.length > 0 && !isTyping && (
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ fontSize: '11px', color: '#6E7681', width: '100%', marginBottom: '2px' }}>📎 Referenced files:</div>
            {message.referenced_files.map((filePath, index) => (
              <button
                key={index}
                onClick={() => handleFileChipClick(filePath)}
                style={{ 
                  padding: '4px 8px', 
                  background: '#161B22', 
                  border: '1px solid #30363D', 
                  borderRadius: '3px', 
                  fontSize: '11px', 
                  color: '#8B949E',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(88, 166, 255, 0.2)'
                  e.currentTarget.style.borderColor = '#58A6FF'
                  e.currentTarget.style.color = '#58A6FF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#161B22'
                  e.currentTarget.style.borderColor = '#30363D'
                  e.currentTarget.style.color = '#8B949E'
                }}
                title={`Click to view ${filePath}`}
              >
                <FileText style={{ width: '12px', height: '12px' }} />
                {filePath.split('/').pop()}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const ChatPanel = ({ messages, onSendMessage, onClearChat, repoPath, onFileClick, files }) => {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      onClearChat()
    }
  }

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
    <div className="chat-panel">
      {/* Chat Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <Bot style={{ width: '20px', height: '20px', color: '#58A6FF' }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '12px', fontWeight: '600', color: '#C9D1D9' }}>AI Assistant</h2>
            <p style={{ fontSize: '11px', color: '#6E7681' }}>Powered by IBM Bob</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                style={{
                  padding: '4px 8px',
                  background: '#21262D',
                  border: '1px solid #30363D',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#8B949E',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F85149'
                  e.currentTarget.style.borderColor = '#F85149'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#21262D'
                  e.currentTarget.style.borderColor = '#30363D'
                  e.currentTarget.style.color = '#8B949E'
                }}
                title="Clear chat history"
              >
                <Trash2 style={{ width: '12px', height: '12px' }} />
                Clear
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#0F1117', borderRadius: '3px', fontSize: '11px' }}>
              <Coins style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              <span style={{ color: '#8B949E' }}>Bobcoins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="chat-messages" style={{ padding: 0 }}>
        {messages.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px', textAlign: 'center' }}>
            <Bot style={{ width: '48px', height: '48px', opacity: 0.4 }} />
            <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#8B949E' }}>Start a conversation</p>
            <p style={{ fontSize: '11px', color: '#6E7681' }}>
              Ask me anything about the codebase
            </p>
            <div style={{ marginTop: '24px', textAlign: 'left', width: '100%' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#6E7681', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Example questions:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '11px', color: '#6E7681' }}>• What does this project do?</p>
                <p style={{ fontSize: '11px', color: '#6E7681' }}>• How is authentication implemented?</p>
                <p style={{ fontSize: '11px', color: '#6E7681' }}>• Where is the API defined?</p>
                <p style={{ fontSize: '11px', color: '#6E7681' }}>• Why was this pattern used?</p>
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
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                padding: '12px',
                background: '#161B22'
              }}>
                <div style={{ 
                  flexShrink: 0, 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: '#21262D',
                  border: '1px solid #30363D'
                }}>
                  <Bot style={{ width: '16px', height: '16px', color: '#58A6FF' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#8B949E' }}>Bob AI</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#8B949E' }}>
                    <Loader2 style={{ width: '16px', height: '16px', color: '#58A6FF' }} className="spinner" />
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
      <div className="chat-input-row" style={{ background: '#0D1117' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {/* Smart Quick Questions */}
          {repoPath && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                "Where do I add a new feature?",
                "How does authentication work?",
                "What are the main entry points?"
              ].map((question, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setInputValue(question)
                    handleSubmit({ preventDefault: () => {} })
                  }}
                  disabled={isSending}
                  style={{
                    padding: '4px 8px',
                    background: '#21262D',
                    border: '1px solid #30363D',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#8B949E',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#30363D'
                    e.currentTarget.style.borderColor = '#58A6FF'
                    e.currentTarget.style.color = '#58A6FF'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#21262D'
                    e.currentTarget.style.borderColor = '#30363D'
                    e.currentTarget.style.color = '#8B949E'
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about the code..."
              className="chat-input"
              rows="3"
              disabled={isSending || !repoPath}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending || !repoPath}
              className="btn-send"
              style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={!repoPath ? "Please analyze a repository first" : "Send message"}
            >
              {isSending ? (
                <Loader2 style={{ width: '20px', height: '20px' }} className="spinner" />
              ) : (
                <Send style={{ width: '20px', height: '20px' }} />
              )}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '11px', color: '#6E7681' }}>
              Press Enter to send, Shift+Enter for new line
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: inputValue.length > 500 ? '#F59E0B' : '#6E7681' }}>
                {inputValue.length} / 1000 chars
              </span>
              {inputValue && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6E7681' }}>
                  <Coins style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
                  <span>~{estimateCoins(inputValue)} coins</span>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatPanel

// Made with Bob
