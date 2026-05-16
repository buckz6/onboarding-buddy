import { Folder, ChevronRight, ChevronDown } from 'lucide-react'
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
  const isDirectory = file.type === 'directory'
  const isMentioned = mentionedFiles.includes(file.path)
  
  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded)
    } else {
      onSelect(file)
    }
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
        className={itemClass}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
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

  const tree = organizeFiles(files)
  const totalFiles = files.filter(f => f.type === 'file').length
  const mentionedCount = mentionedFiles.length

  return (
    <div className="sidebar">
      <div className="sidebar-title">
        <div>Explorer</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '11px', color: '#6E7681', textTransform: 'none', letterSpacing: 'normal' }}>
          <span>{totalFiles} files</span>
          {mentionedCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#58A6FF' }}>
              <span>✨</span>
              {mentionedCount} mentioned
            </span>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderTree(tree)}
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
