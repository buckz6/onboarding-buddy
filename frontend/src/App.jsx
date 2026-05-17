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
  const [progress, setProgress] = useState(0)
  const [filesFound, setFilesFound] = useState(0)

  const handleRepoLinkClick = (url) => {
    setRepoUrl(url)
    handleAnalyze(url)
  }

  const validateGitHubUrl = (url) => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    return githubPattern.test(url.trim())
  }

  const handleAnalyze = async (urlOverride = null) => {
    const urlToAnalyze = urlOverride || repoUrl
    
    if (!urlToAnalyze.trim()) {
      setError('Please enter a GitHub repository URL')
      return
    }

    // Validate GitHub URL format
    if (!validateGitHubUrl(urlToAnalyze)) {
      setError('Invalid GitHub URL format. Please use: https://github.com/username/repository')
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
    setProgress(0)
    setFilesFound(0)

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 200)

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ github_url: urlToAnalyze }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = errorData.detail || 'Failed to analyze repository'
        
        // Handle specific error cases
        if (response.status === 404) {
          errorMessage = '❌ Repository not found. Please check the URL and try again.'
        } else if (response.status === 403) {
          errorMessage = '🔒 This repository is private. Please use a public repository or provide authentication.'
        } else if (response.status === 413 || errorMessage.includes('too large')) {
          errorMessage = '⚠️ Repository is too large. Please try a smaller repository (< 100MB).'
        } else if (response.status === 401) {
          errorMessage = '🔐 Authentication required. This repository may be private.'
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = '⏱️ GitHub API rate limit exceeded. Please try again later.'
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Complete progress
      clearInterval(progressInterval)
      setProgress(100)
      setFilesFound(data.total_files)
      
      // Wait a bit to show 100% before hiding
      setTimeout(() => {
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
        
        setIsAnalyzing(false)
        setProgress(0)
        setFilesFound(0)
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)
      setError(err.message)
      console.error('Error analyzing repository:', err)
      setIsAnalyzing(false)
      setProgress(0)
      setFilesFound(0)
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

      {/* Progress Bar */}
      {isAnalyzing && (
        <div style={{
          background: '#161B22',
          borderBottom: '1px solid #30363D',
          padding: '12px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8B949E' }}>
              Analyzing repository... Found {filesFound} files
            </span>
            <span style={{ fontSize: '12px', color: '#58A6FF', fontWeight: '600' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#21262D',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #1F6FEB 0%, #58A6FF 100%)',
              transition: 'width 0.3s ease',
              borderRadius: '2px'
            }} />
          </div>
        </div>
      )}

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

        {/* Center Panel - Code Viewer or Welcome Screen */}
        {!repoPath && !isAnalyzing ? (
          <div className="main-panel" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}>
            <div className="welcome-container" style={{
              textAlign: 'center',
              maxWidth: '500px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Robot Icon */}
              <div style={{ fontSize: '64px', lineHeight: 1 }}>🤖</div>
              
              {/* Heading */}
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#C9D1D9',
                  marginBottom: '8px'
                }}>
                  Welcome to Onboarding Buddy
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: '#8B949E',
                  marginBottom: '4px'
                }}>
                  Powered by IBM Bob
                </p>
              </div>

              {/* Description */}
              <div>
                <p style={{
                  fontSize: '15px',
                  color: '#8B949E',
                  marginBottom: '8px'
                }}>
                  Understand any codebase instantly.
                </p>
                <p style={{
                  fontSize: '13px',
                  color: '#6E7681'
                }}>
                  Paste a GitHub URL above to get started.
                </p>
              </div>

              {/* Popular Repositories */}
              <div style={{
                marginTop: '16px',
                padding: '20px',
                background: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '8px'
              }}>
                <p style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#8B949E',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Try these popular repositories:
                </p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {[
                    { url: 'https://github.com/tiangolo/fastapi', name: 'FastAPI - Modern Python web framework' },
                    { url: 'https://github.com/expressjs/express', name: 'Express - Node.js web framework' },
                    { url: 'https://github.com/laravel/laravel', name: 'Laravel - PHP web framework' }
                  ].map((repo, index) => (
                    <button
                      key={index}
                      onClick={() => handleRepoLinkClick(repo.url)}
                      style={{
                        padding: '10px 12px',
                        background: '#0D1117',
                        border: '1px solid #30363D',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#58A6FF',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#161B22'
                        e.currentTarget.style.borderColor = '#58A6FF'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#0D1117'
                        e.currentTarget.style.borderColor = '#30363D'
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                        {repo.url.split('/').slice(-2).join('/')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8B949E' }}>
                        {repo.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <CodeViewer
            selectedFile={selectedFile}
            fileContent={fileContent}
            isLoading={isLoadingFile}
            repoPath={repoPath}
          />
        )}

        {/* Right Sidebar - Chat Panel */}
        <ChatPanel
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
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
