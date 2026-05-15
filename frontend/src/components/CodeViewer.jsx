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
    // In production, you'd use highlight.js or Prism.js from CDN
    const lines = code.split('\n')
    
    return lines.map((line, index) => {
      let highlightedLine = line
      
      // Keywords
      const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'from', 'class', 'def', 'async', 'await', 'try', 'catch', 'throw']
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
        highlightedLine = highlightedLine.replace(regex, '<span class="text-purple-400">$1</span>')
      })
      
      // Strings
      highlightedLine = highlightedLine.replace(/(["'`])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
      
      // Comments
      highlightedLine = highlightedLine.replace(/(\/\/.*$|#.*$)/g, '<span class="text-gray-500">$1</span>')
      
      // Numbers
      highlightedLine = highlightedLine.replace(/\b(\d+)\b/g, '<span class="text-yellow-400">$1</span>')
      
      return (
        <div key={index} className="flex hover:bg-surface-light/30">
          <span className="text-gray-600 select-none text-right pr-4 pl-2" style={{ minWidth: '3rem' }}>
            {index + 1}
          </span>
          <span 
            className="text-gray-200 flex-1 font-mono text-sm"
            dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
          />
        </div>
      )
    })
  }

  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
        <FileCode className="w-20 h-20 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No File Selected</h3>
        <p className="text-sm max-w-md">
          Select a file from the tree on the left to view its contents here.
        </p>
        <div className="mt-8 p-4 bg-surface rounded-lg max-w-md">
          <p className="text-xs text-gray-400 mb-2">✨ Features:</p>
          <ul className="text-xs text-gray-500 space-y-1 text-left">
            <li>• Real-time syntax highlighting</li>
            <li>• Line numbers for easy reference</li>
            <li>• Copy code to clipboard</li>
            <li>• AI-powered "Why?" explanations</li>
          </ul>
        </div>
      </div>
    )
  }

  if (selectedFile.type === 'directory') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
        <AlertCircle className="w-16 h-16 mb-4 text-yellow-500 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Directory Selected</h3>
        <p className="text-sm max-w-md">
          You've selected a directory. Please select a file to view its contents.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
        <p className="text-sm">Loading file content...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* File Header */}
      <div className="px-6 py-4 border-b border-surface-light bg-surface">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {selectedFile.path.split('/').pop()}
            </h2>
            <p className="text-xs text-gray-400 mt-1">{selectedFile.path}</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedFile.extension && (
              <span className="px-2 py-1 bg-background rounded text-xs text-gray-400">
                .{selectedFile.extension}
              </span>
            )}
            {selectedFile.size && (
              <span className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</span>
            )}
            <button
              onClick={handleWhyClick}
              className="px-3 py-1.5 bg-secondary hover:bg-indigo-600 rounded text-xs font-medium transition-colors flex items-center gap-1"
              title="Explain why this code exists"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Why?
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-surface-light hover:bg-gray-600 rounded text-xs font-medium transition-colors flex items-center gap-1"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Code Content Area */}
      <div className="flex-1 overflow-auto bg-background">
        {fileContent ? (
          <div className="p-4">
            <div className="bg-surface rounded-lg border border-surface-light overflow-hidden">
              <div className="bg-background p-2">
                {highlightCode(fileContent, getLanguageFromExtension(selectedFile.extension))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">No content available</p>
          </div>
        )}
      </div>

      {/* Why Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-surface-light max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-surface-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-semibold text-white">Why This Code?</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingWhy ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 mb-4 animate-spin text-primary" />
                  <p className="text-sm text-gray-400">Analyzing code...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-background rounded-lg p-4 border border-surface-light">
                    <p className="text-xs text-gray-400 mb-2">Analyzing code from:</p>
                    <p className="text-sm text-gray-300 font-mono">{selectedFile.path}</p>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-sm text-gray-200 whitespace-pre-wrap">
                      {whyExplanation}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-surface-light flex justify-end">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-4 py-2 bg-primary hover:bg-indigo-600 rounded text-sm font-medium transition-colors"
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
