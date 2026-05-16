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
        highlightedLine = highlightedLine.replace(regex, '<span class="text-purple-400">$1</span>')
      })
      
      // Strings
      highlightedLine = highlightedLine.replace(/(["'`])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
      
      // Comments
      highlightedLine = highlightedLine.replace(/(\/\/.*$|#.*$)/g, '<span class="text-gray-600">$1</span>')
      
      // Numbers
      highlightedLine = highlightedLine.replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>')
      
      return (
        <div key={index} className="flex hover:bg-[#252535] transition-colors">
          <span className="text-gray-600 select-none text-right pr-4 pl-4 font-mono text-xs" style={{ minWidth: '3.5rem' }}>
            {index + 1}
          </span>
          <span
            className="text-gray-300 flex-1 font-mono text-sm pr-4"
            dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
          />
        </div>
      )
    })
  }

  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center bg-[#1E1E2E]">
        <FileCode className="w-16 h-16 mb-3 opacity-40" />
        <h3 className="text-base font-semibold mb-2 text-gray-300">No File Selected</h3>
        <p className="text-sm max-w-md text-gray-500">
          Select a file from the explorer to view its contents here.
        </p>
        <div className="mt-6 p-4 bg-[#0F1117] rounded-lg max-w-md border border-[#2a2d3a]">
          <p className="text-xs text-gray-400 mb-2">✨ Features:</p>
          <ul className="text-xs text-gray-500 space-y-1 text-left">
            <li>• Syntax highlighting</li>
            <li>• Line numbers</li>
            <li>• Copy to clipboard</li>
            <li>• AI "Why?" explanations</li>
          </ul>
        </div>
      </div>
    )
  }

  if (selectedFile.type === 'directory') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center bg-[#1E1E2E]">
        <AlertCircle className="w-12 h-12 mb-3 text-yellow-500 opacity-40" />
        <h3 className="text-base font-semibold mb-2 text-gray-300">Directory Selected</h3>
        <p className="text-sm max-w-md text-gray-500">
          Please select a file to view its contents.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 bg-[#1E1E2E]">
        <Loader2 className="w-10 h-10 mb-3 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading file content...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#1E1E2E]">
      {/* File Header */}
      <div className="px-4 py-3 border-b border-[#2a2d3a] bg-[#1a1d29]">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">
              {selectedFile.path.split('/').pop()}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedFile.path}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {selectedFile.extension && (
              <span className="px-2 py-1 bg-[#0F1117] rounded text-xs text-gray-500">
                .{selectedFile.extension}
              </span>
            )}
            {selectedFile.size && (
              <span className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</span>
            )}
            <button
              onClick={handleWhyClick}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-medium transition-colors flex items-center gap-1"
              title="Explain why this code exists"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Why?
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#2a2d3a] hover:bg-[#3a3d4a] rounded text-xs font-medium transition-colors flex items-center gap-1"
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
      <div className="flex-1 overflow-auto bg-[#1E1E2E]">
        {fileContent ? (
          <div className="h-full">
            <div className="bg-[#1E1E2E]">
              {highlightCode(fileContent, getLanguageFromExtension(selectedFile.extension))}
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d29] rounded-lg border border-[#2a2d3a] max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#2a2d3a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Why This Code?</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingWhy ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 mb-4 animate-spin text-indigo-500" />
                  <p className="text-sm text-gray-400">Analyzing code...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#0F1117] rounded-lg p-4 border border-[#2a2d3a]">
                    <p className="text-xs text-gray-500 mb-2">Analyzing code from:</p>
                    <p className="text-sm text-gray-300 font-mono">{selectedFile.path}</p>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {whyExplanation}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#2a2d3a] flex justify-end">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-medium transition-colors"
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
