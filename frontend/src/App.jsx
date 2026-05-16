import { useState } from 'react'
import { Github, Loader2 } from 'lucide-react'
import FileTree from './components/FileTree'
import CodeViewer from './components/CodeViewer'
import ChatPanel from './components/ChatPanel'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [repoUrl, setRepoUrl] = useState('')
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [repoName, setRepoName] = useState('')
  const [repoPath, setRepoPath] = useState('')
  const [fileContent, setFileContent] = useState(null)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [mentionedFiles, setMentionedFiles] = useState([])

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setFiles([])
    setSelectedFile(null)
    setRepoName('')
    setRepoPath('')
    setFileContent(null)
    setMentionedFiles([])

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ github_url: repoUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to analyze repository')
      }

      const data = await response.json()
      setFiles(data.files)
      setRepoName(data.repository_name)
      setRepoPath(data.repo_path)
      
      // Add welcome message to chat
      setChatMessages([
        {
          role: 'assistant',
          content: `Repository "${data.repository_name}" analyzed successfully! Found ${data.total_files} files. Ask me anything about this codebase.`,
          timestamp: new Date().toISOString()
        }
      ])
    } catch (err) {
      setError(err.message)
      console.error('Error analyzing repository:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileSelect = async (file) => {
    if (file.type === 'directory') {
      setSelectedFile(file)
      setFileContent(null)
      return
    }

    setSelectedFile(file)
    setIsLoadingFile(true)
    setFileContent(null)

    try {
      const response = await fetch(`${API_BASE}/file-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: file.path,
          repo_path: repoPath
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to load file content')
      }

      const data = await response.json()
      setFileContent(data.content)
    } catch (err) {
      console.error('Error loading file:', err)
      setFileContent('// Error loading file content')
    } finally {
      setIsLoadingFile(false)
    }
  }

  const handleSendMessage = async (message) => {
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    setChatMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          file_context: selectedFile?.path || null,
          repo_path: repoPath
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      // Add assistant response to chat
      const assistantMessage = {
        role: 'assistant',
        content: data.answer,
        timestamp: data.timestamp,
        referenced_files: data.referenced_files || []
      }
      setChatMessages(prev => [...prev, assistantMessage])
      
      // Update mentioned files for highlighting
      if (data.referenced_files && data.referenced_files.length > 0) {
        setMentionedFiles(prev => [...new Set([...prev, ...data.referenced_files])])
      }
    } catch (err) {
      console.error('Error sending message:', err)
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, errorMessage])
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0F1117] text-white overflow-hidden">
      {/* Header Bar */}
      <header className="flex-shrink-0 bg-[#1a1d29] border-b border-[#2a2d3a] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="w-7 h-7 text-indigo-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Onboarding Buddy</h1>
              <p className="text-xs text-gray-400">AI-Powered Codebase Explorer</p>
            </div>
          </div>
          {repoName && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Repository</p>
              <p className="text-sm font-semibold text-indigo-400">{repoName}</p>
            </div>
          )}
        </div>
      </header>

      {/* GitHub URL Input Bar */}
      <div className="flex-shrink-0 bg-[#1a1d29] border-b border-[#2a2d3a] px-6 py-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
            className="flex-1 px-4 py-2 bg-[#0F1117] border border-[#2a2d3a] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500 text-sm"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Repository'
            )}
          </button>
        </div>
        {error && (
          <div className="mt-2 px-4 py-2 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - File Tree (280px) */}
        <div className="w-[280px] flex-shrink-0 bg-[#111827] border-r border-[#2a2d3a] overflow-hidden">
          <FileTree
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            mentionedFiles={mentionedFiles}
          />
        </div>

        {/* Center Panel - Code Viewer (flex-1) */}
        <div className="flex-1 overflow-hidden min-w-0">
          <CodeViewer
            selectedFile={selectedFile}
            fileContent={fileContent}
            isLoading={isLoadingFile}
            repoPath={repoPath}
          />
        </div>

        {/* Right Sidebar - Chat Panel (350px) */}
        <div className="w-[350px] flex-shrink-0 bg-[#111827] border-l border-[#2a2d3a] overflow-hidden">
          <ChatPanel
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            repoPath={repoPath}
            onFileClick={handleFileSelect}
            files={files}
          />
        </div>
      </div>
    </div>
  )
}

export default App

// Made with Bob
