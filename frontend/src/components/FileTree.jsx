import { Folder, ChevronRight, ChevronDown, Search, X } from 'lucide-react'
import { useState } from 'react'

const getFileEmoji = (extension) => {
  const emojiMap = {
    py: '🐍',
    js: '📄',
    jsx: '⚛️',
    ts: '📘',
    tsx: '⚛️',
    json: '📋',
    md: '📝',
    css: '🎨',
    scss: '🎨',
    html: '🌐',
    xml: '📰',
    yml: '⚙️',
    yaml: '⚙️',
    toml: '⚙️',
    txt: '📃',
    pdf: '📕',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🎭',
    mp4: '🎬',
    mp3: '🎵',
    zip: '📦',
    tar: '📦',
    gz: '📦',
    sql: '🗄️',
    db: '🗄️',
    env: '🔐',
    gitignore: '🚫',
    dockerfile: '🐳',
    sh: '⚡',
    bash: '⚡',
    java: '☕',
    cpp: '⚙️',
    c: '⚙️',
    go: '🐹',
    rs: '🦀',
    php: '🐘',
    rb: '💎',
    swift: '🦅',
    kt: '🎯',
  }
  
  return emojiMap[extension?.toLowerCase()] || '📄'
}

const FileTreeItem = ({ file, isSelected, onSelect, level = 0, mentionedFiles = [] }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const isDirectory = file.type === 'directory'
  const isMentioned = mentionedFiles.includes(file.path)
  
  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded)
    } else {
      onSelect(file)
    }
  }

  const handleMouseEnter = (e) => {
    if (!isDirectory) {
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltipPosition({ x: rect.right + 10, y: rect.top })
      setShowTooltip(true)
    }
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  const getFileType = (ext) => {
    const typeMap = {
      py: 'Python',
      js: 'JavaScript',
      jsx: 'React JSX',
      ts: 'TypeScript',
      tsx: 'React TSX',
      json: 'JSON',
      md: 'Markdown',
      css: 'CSS',
      scss: 'SCSS',
      html: 'HTML',
      xml: 'XML',
      yml: 'YAML',
      yaml: 'YAML',
      toml: 'TOML',
      txt: 'Text',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      go: 'Go',
      rs: 'Rust',
      php: 'PHP',
      rb: 'Ruby',
      swift: 'Swift',
      kt: 'Kotlin',
    }
    return typeMap[ext?.toLowerCase()] || 'File'
  }
  
  // Count files in directory
  const fileCount = isDirectory && file.children 
    ? Object.values(file.children).filter(child => child.type === 'file').length 
    : 0
  
  const itemClass = `file-item ${isSelected ? 'active' : ''} ${isMentioned ? 'mentioned' : ''}`
  
  return (
    <div>
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={itemClass}
        style={{ paddingLeft: `${level * 16 + 12}px`, position: 'relative' }}
      >
        {isDirectory && (
          <span style={{ color: '#8B949E', flexShrink: 0 }}>
            {isExpanded ? (
              <ChevronDown style={{ width: '14px', height: '14px' }} />
            ) : (
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            )}
          </span>
        )}
        {isDirectory ? (
          <Folder style={{ 
            width: '16px', 
            height: '16px', 
            flexShrink: 0, 
            color: isExpanded ? '#58A6FF' : '#8B949E' 
          }} />
        ) : (
          <span style={{ fontSize: '14px', flexShrink: 0 }} title={file.extension ? `.${file.extension}` : 'file'}>
            {getFileEmoji(file.extension)}
          </span>
        )}
        <span style={{ 
          fontSize: '13px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          flex: 1,
          fontWeight: isMentioned ? '600' : 'normal',
          color: isMentioned ? '#58A6FF' : 'inherit'
        }}>
          {file.path.split('/').pop()}
        </span>
        {isDirectory && fileCount > 0 && (
          <span style={{ 
            fontSize: '11px', 
            background: '#161B22', 
            padding: '2px 6px', 
            borderRadius: '3px', 
            color: '#8B949E',
            flexShrink: 0
          }}>
            {fileCount}
          </span>
        )}
        {!isDirectory && file.size && (
          <span style={{ fontSize: '11px', color: '#6E7681', flexShrink: 0 }}>
            {formatFileSize(file.size)}
          </span>
        )}
        {isMentioned && (
          <span style={{ 
            fontSize: '11px', 
            background: 'rgba(88, 166, 255, 0.2)', 
            padding: '2px 6px', 
            borderRadius: '3px', 
            color: '#58A6FF',
            flexShrink: 0
          }} title="Mentioned by Bob">
            ✨
          </span>
        )}
        
        {/* Tooltip */}
        {showTooltip && !isDirectory && (
          <div style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            background: '#1C2128',
            border: '1px solid #30363D',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#C9D1D9',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            minWidth: '200px'
          }}>
            <div style={{ marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #30363D' }}>
              <div style={{ fontWeight: '600', color: '#E5E7EB', marginBottom: '2px' }}>
                {file.path.split('/').pop()}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8B949E' }}>Type:</span>
                <span style={{ color: '#58A6FF' }}>{getFileType(file.extension)}</span>
              </div>
              {file.size && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8B949E' }}>Size:</span>
                  <span>{formatFileSize(file.size)}</span>
                </div>
              )}
              {file.extension && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8B949E' }}>Extension:</span>
                  <span>.{file.extension}</span>
                </div>
              )}
              <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #30363D' }}>
                <div style={{ color: '#6E7681', fontSize: '10px', wordBreak: 'break-all' }}>
                  {file.path}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {isDirectory && isExpanded && file.children && (
        <div>
          {Object.values(file.children).map((child) => (
            <FileTreeItem
              key={child.path}
              file={child}
              isSelected={isSelected}
              onSelect={onSelect}
              level={level + 1}
              mentionedFiles={mentionedFiles}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const FileTree = ({ files, selectedFile, onFileSelect, mentionedFiles = [] }) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Organize files into a tree structure
  const organizeFiles = (fileList) => {
    const tree = {}
    
    fileList.forEach(file => {
      const parts = file.path.split('/')
      let current = tree
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: index === parts.length - 1 ? file.type : 'directory',
            extension: file.extension,
            size: file.size,
            children: {}
          }
        }
        current = current[part].children
      })
    })
    
    return tree
  }

  // Filter files based on search query
  const filterFiles = (fileList) => {
    if (!searchQuery.trim()) return fileList
    
    const query = searchQuery.toLowerCase()
    return fileList.filter(file =>
      file.path.toLowerCase().includes(query)
    )
  }

  const renderTree = (tree, level = 0) => {
    // Sort: directories first, then files alphabetically
    const sorted = Object.values(tree).sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1
      if (a.type !== 'directory' && b.type === 'directory') return 1
      return a.name.localeCompare(b.name)
    })

    return sorted.map((node) => {
      const isSelected = selectedFile?.path === node.path
      
      return (
        <FileTreeItem
          key={node.path}
          file={node}
          isSelected={isSelected}
          onSelect={onFileSelect}
          level={level}
          mentionedFiles={mentionedFiles}
        />
      )
    })
  }

  if (files.length === 0) {
    return (
      <div className="sidebar">
        <div className="empty-state">
          <Folder style={{ width: '48px', height: '48px', opacity: 0.4 }} />
          <p style={{ fontSize: '13px', color: '#8B949E' }}>No repository analyzed yet</p>
          <p style={{ fontSize: '11px', marginTop: '4px', color: '#6E7681' }}>Enter a GitHub URL above to get started</p>
        </div>
      </div>
    )
  }

  const filteredFiles = filterFiles(files)
  const tree = organizeFiles(filteredFiles)
  const totalFiles = files.filter(f => f.type === 'file').length
  const filteredCount = filteredFiles.filter(f => f.type === 'file').length
  const mentionedCount = mentionedFiles.length

  const highlightMatch = (text) => {
    if (!searchQuery.trim()) return text
    
    const query = searchQuery.toLowerCase()
    const index = text.toLowerCase().indexOf(query)
    
    if (index === -1) return text
    
    return (
      <>
        {text.substring(0, index)}
        <span style={{ background: '#FFA65780', color: '#FFA657', fontWeight: '600' }}>
          {text.substring(index, index + searchQuery.length)}
        </span>
        {text.substring(index + searchQuery.length)}
      </>
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-title">
        <div>Explorer</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '11px', color: '#6E7681', textTransform: 'none', letterSpacing: 'normal' }}>
          <span>{searchQuery ? `${filteredCount} / ` : ''}{totalFiles} files</span>
          {mentionedCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#58A6FF' }}>
              <span>✨</span>
              {mentionedCount} mentioned
            </span>
          )}
        </div>
      </div>
      
      {/* Search Input */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #21262D' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search style={{
            position: 'absolute',
            left: '10px',
            width: '14px',
            height: '14px',
            color: '#6E7681',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            style={{
              width: '100%',
              background: '#21262D',
              border: '1px solid #30363D',
              borderRadius: '6px',
              padding: '6px 32px 6px 32px',
              color: '#E5E7EB',
              fontSize: '12px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#58A6FF'}
            onBlur={(e) => e.target.style.borderColor = '#30363D'}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                color: '#6E7681'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#E5E7EB'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6E7681'}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredFiles.length === 0 && searchQuery ? (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#6E7681' }}>No files found</p>
            <p style={{ fontSize: '11px', color: '#6E7681', marginTop: '4px' }}>Try a different search term</p>
          </div>
        ) : (
          renderTree(tree)
        )}
      </div>
      
      {/* Legend */}
      <div style={{ 
        padding: '10px 16px', 
        borderTop: '1px solid #21262D', 
        background: '#0D1117' 
      }}>
        <p style={{ fontSize: '11px', color: '#6E7681', marginBottom: '6px' }}>File Types:</p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '6px', 
          fontSize: '11px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🐍</span>
            <span style={{ color: '#8B949E' }}>Python</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚛️</span>
            <span style={{ color: '#8B949E' }}>React</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📄</span>
            <span style={{ color: '#8B949E' }}>JS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🎨</span>
            <span style={{ color: '#8B949E' }}>CSS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📋</span>
            <span style={{ color: '#8B949E' }}>JSON</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📝</span>
            <span style={{ color: '#8B949E' }}>MD</span>
          </div>
        </div>
        {mentionedCount > 0 && (
          <p style={{ fontSize: '11px', color: '#6E7681', marginTop: '6px' }}>
            ✨ = Mentioned by Bob AI
          </p>
        )}
      </div>
    </div>
  )
}

export default FileTree

// Made with Bob
