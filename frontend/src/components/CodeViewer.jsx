import { useState, useEffect } from 'react'
import { FileCode, AlertCircle, Loader2, Copy, Check, HelpCircle, X } from 'lucide-react'

const API_BASE_URL = '/api'

const CodeViewer = ({ selectedFile, fileContent, isLoading, repoPath }) => {
  const [copied, setCopied] = useState(false)
  const [showWhyModal, setShowWhyModal] = useState(false)
  const [whyExplanation, setWhyExplanation] = useState('')
  const [isLoadingWhy, setIsLoadingWhy] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const handleCopy = () => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent)
      setCopied(true)
    }
  }

  const handleWhyClick = async () => {
    if (!fileContent || !repoPath) return

    setShowWhyModal(true)
    setIsLoadingWhy(true)
    setWhyExplanation('')

    // Get selected text or use first 500 chars
    const selection = window.getSelection().toString()
    const codeToAnalyze = selection || fileContent.substring(0, 500)
    setSelectedCode(codeToAnalyze)

    try {
      const response = await fetch(`${API_BASE_URL}/why`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code_snippet: codeToAnalyze,
          file_path: selectedFile.path,
          repo_path: repoPath
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get explanation')
      }

      const data = await response.json()
      setWhyExplanation(data.explanation)
    } catch (err) {
      console.error('Error getting explanation:', err)
      setWhyExplanation('Sorry, I encountered an error analyzing this code. Please try again.')
    } finally {
      setIsLoadingWhy(false)
    }
  }

  const getLanguageFromExtension = (ext) => {
    const langMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
      sh: 'bash',
      bash: 'bash',
    }
    return langMap[ext] || 'plaintext'
  }

  const highlightCode = (code, language) => {
    // Simple syntax highlighting using regex patterns
    const lines = code.split('\n')
    
    return lines.map((line, index) => {
      let highlightedLine = line
      
      // Keywords
      const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'from', 'class', 'def', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super']
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
        highlightedLine = highlightedLine.replace(regex, '<span style="color: #C792EA">$1</span>')
      })
      
      // Strings
      highlightedLine = highlightedLine.replace(/(["'`])(.*?)\1/g, '<span style="color: #C3E88D">$1$2$1</span>')
      
      // Comments
      highlightedLine = highlightedLine.replace(/(\/\/.*$|#.*$)/g, '<span style="color: #6E7681">$1</span>')
      
      // Numbers
      highlightedLine = highlightedLine.replace(/\b(\d+)\b/g, '<span style="color: #F78C6C">$1</span>')
      
      return (
        <div key={index} style={{ display: 'flex', transition: 'background 0.15s' }} 
             onMouseEnter={(e) => e.currentTarget.style.background = '#161B22'}
             onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <span style={{ 
            color: '#6E7681', 
            userSelect: 'none', 
            textAlign: 'right', 
            paddingRight: '16px', 
            paddingLeft: '16px', 
            fontFamily: 'monospace', 
            fontSize: '12px',
            minWidth: '56px'
          }}>
            {index + 1}
          </span>
          <span
            style={{ 
              color: '#C9D1D9', 
              flex: 1, 
              fontFamily: 'monospace', 
              fontSize: '13px',
              paddingRight: '16px'
            }}
            dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
          />
        </div>
      )
    })
  }

  if (!selectedFile) {
    return (
      <div className="main-panel">
        <div className="empty-state">
          <FileCode style={{ width: '64px', height: '64px', opacity: 0.4 }} />
          <h3>No File Selected</h3>
          <p style={{ maxWidth: '400px' }}>
            Select a file from the explorer to view its contents here.
          </p>
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: '#0F1117', 
            borderRadius: '6px', 
            maxWidth: '400px', 
            border: '1px solid #30363D' 
          }}>
            <p style={{ fontSize: '11px', color: '#8B949E', marginBottom: '8px' }}>✨ Features:</p>
            <ul style={{ fontSize: '11px', color: '#8B949E', listStyle: 'none', padding: 0 }}>
              <li>• Syntax highlighting</li>
              <li>• Line numbers</li>
              <li>• Copy to clipboard</li>
              <li>• AI "Why?" explanations</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (selectedFile.type === 'directory') {
    return (
      <div className="main-panel">
        <div className="empty-state">
          <AlertCircle style={{ width: '48px', height: '48px', color: '#F59E0B', opacity: 0.4 }} />
          <h3>Directory Selected</h3>
          <p style={{ maxWidth: '400px' }}>
            Please select a file to view its contents.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="main-panel">
        <div className="empty-state">
          <Loader2 style={{ width: '40px', height: '40px', color: '#58A6FF' }} className="spinner" />
          <p style={{ fontSize: '13px', color: '#8B949E' }}>Loading file content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main-panel">
      {/* File Header */}
      <div className="code-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#E5E7EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedFile.path.split('/').pop()}
          </h2>
          <p style={{ fontSize: '11px', color: '#8B949E', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.path}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
          {selectedFile.extension && (
            <span style={{ 
              padding: '4px 8px', 
              background: '#0F1117', 
              borderRadius: '3px', 
              fontSize: '11px', 
              color: '#8B949E' 
            }}>
              .{selectedFile.extension}
            </span>
          )}
          {selectedFile.size && (
            <span style={{ fontSize: '11px', color: '#6E7681' }}>{formatFileSize(selectedFile.size)}</span>
          )}
          <button
            onClick={handleWhyClick}
            style={{ 
              padding: '6px 12px', 
              background: '#1F6FEB', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontWeight: '500',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#388BFD'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1F6FEB'}
            title="Explain why this code exists"
          >
            <HelpCircle style={{ width: '14px', height: '14px' }} />
            Why?
          </button>
          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check style={{ width: '14px', height: '14px' }} />
                Copied!
              </>
            ) : (
              <>
                <Copy style={{ width: '14px', height: '14px' }} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content Area */}
      <div className="code-content" style={{ padding: 0 }}>
        {fileContent ? (
          <div style={{ background: '#0D1117' }}>
            {highlightCode(fileContent, getLanguageFromExtension(selectedFile.extension))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8B949E' }}>
            <p style={{ fontSize: '13px' }}>No content available</p>
          </div>
        )}
      </div>

      {/* Why Modal */}
      {showWhyModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0, 0, 0, 0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 50, 
          padding: '16px' 
        }}>
          <div style={{ 
            background: '#161B22', 
            borderRadius: '8px', 
            border: '1px solid #30363D', 
            maxWidth: '672px', 
            width: '100%', 
            maxHeight: '80vh', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid #30363D', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle style={{ width: '20px', height: '20px', color: '#58A6FF' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#E5E7EB' }}>Why This Code?</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                style={{ 
                  color: '#8B949E', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#E5E7EB'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8B949E'}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {isLoadingWhy ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                  <Loader2 style={{ width: '32px', height: '32px', marginBottom: '16px', color: '#58A6FF' }} className="spinner" />
                  <p style={{ fontSize: '13px', color: '#8B949E' }}>Analyzing code...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ 
                    background: '#0F1117', 
                    borderRadius: '6px', 
                    padding: '16px', 
                    border: '1px solid #30363D' 
                  }}>
                    <p style={{ fontSize: '11px', color: '#8B949E', marginBottom: '8px' }}>Analyzing code from:</p>
                    <p style={{ fontSize: '13px', color: '#C9D1D9', fontFamily: 'monospace' }}>{selectedFile.path}</p>
                  </div>
                  <div style={{ fontSize: '13px', color: '#C9D1D9', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {whyExplanation}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid #30363D', 
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => setShowWhyModal(false)}
                style={{ 
                  padding: '8px 16px', 
                  background: '#1F6FEB', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#388BFD'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#1F6FEB'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default CodeViewer

// Made with Bob
