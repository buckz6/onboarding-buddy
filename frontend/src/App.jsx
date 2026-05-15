import { useState } from 'react'
import { Github, Loader2 } from 'lucide-react'
import FileTree from './components/FileTree'
import CodeViewer from './components/CodeViewer'
import ChatPanel from './components/ChatPanel'

const API_BASE_URL = '/api'

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
      const response = await fetch(`${API_BASE_URL}/analyze`, {
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
      const response = await fetch(`${API_BASE_URL}/file-content`, {
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
      const response = await fetch(`${API_BASE_URL}/ask`, {
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
    <div className="flex flex-col h-screen bg-background text-white">
      {/* Header */}
      <header className="bg-surface border-b border-surface-light px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-white">Onboarding Buddy</h1>
              <p className="text-sm text-gray-400">AI-Powered Codebase Explorer</p>
            </div>
          </div>
          {repoName && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Analyzing</p>
              <p className="text-lg font-semibold text-secondary">{repoName}</p>
            </div>
          )}
        </div>
      </header>

      {/* Repository Input */}
      <div className="bg-surface border-b border-surface-light px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
            className="flex-1 px-4 py-2 bg-background border border-surface-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2 bg-primary hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
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
          <div className="mt-3 px-4 py-2 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree - Left Sidebar */}
        <div className="w-80 bg-surface border-r border-surface-light overflow-y-auto">
          <FileTree
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            mentionedFiles={mentionedFiles}
          />
        </div>

        {/* Code Viewer - Center Panel */}
        <div className="flex-1 overflow-y-auto">
          <CodeViewer
            selectedFile={selectedFile}
            fileContent={fileContent}
            isLoading={isLoadingFile}
            repoPath={repoPath}
          />
        </div>

        {/* Chat Panel - Right Sidebar */}
        <div className="w-96 bg-surface border-l border-surface-light">
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
