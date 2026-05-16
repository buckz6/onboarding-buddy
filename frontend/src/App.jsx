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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header Bar */}
      <header className="app-header">
        <Github style={{ width: '28px', height: '28px', color: '#58A6FF' }} />
        <div>
          <h1>Onboarding Buddy</h1>
          <p>AI-Powered Codebase Explorer</p>
        </div>
        {repoName && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#8B949E' }}>Repository</p>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#58A6FF' }}>{repoName}</p>
          </div>
        )}
      </header>

      {/* GitHub URL Input Bar */}
      <div style={{ background: '#161B22', borderBottom: '1px solid #30363D', padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
            className="url-input"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px' }} className="spinner" />
                Analyzing...
              </>
            ) : (
              'Analyze Repository'
            )}
          </button>
        </div>
        {error && (
          <div style={{ 
            marginTop: '8px', 
            padding: '8px 12px', 
            background: 'rgba(248, 81, 73, 0.1)', 
            border: '1px solid #F85149', 
            borderRadius: '6px', 
            color: '#F85149', 
            fontSize: '12px' 
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Main 3-Column Layout */}
      <div className="app-body">
        {/* Left Sidebar - File Tree */}
        <FileTree
          files={files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          mentionedFiles={mentionedFiles}
        />

        {/* Center Panel - Code Viewer */}
        <CodeViewer
          selectedFile={selectedFile}
          fileContent={fileContent}
          isLoading={isLoadingFile}
          repoPath={repoPath}
        />

        {/* Right Sidebar - Chat Panel */}
        <ChatPanel
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          repoPath={repoPath}
          onFileClick={handleFileSelect}
          files={files}
        />
      </div>
    </div>
  )
}

export default App

// Made with Bob
