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
  
  return (
    <div>
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-light transition-colors
          ${isSelected ? 'bg-primary/20 border-l-2 border-primary' : ''}
          ${isMentioned ? 'bg-secondary/10 border-l-2 border-secondary' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {isDirectory && (
          <span className="text-gray-400 flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        {isDirectory ? (
          <Folder className={`w-4 h-4 flex-shrink-0 ${isExpanded ? 'text-primary' : 'text-gray-400'}`} />
        ) : (
          <span className="text-base flex-shrink-0" title={file.extension ? `.${file.extension}` : 'file'}>
            {getFileEmoji(file.extension)}
          </span>
        )}
        <span className={`text-sm truncate flex-1 ${isMentioned ? 'font-semibold text-secondary' : ''}`}>
          {file.path.split('/').pop()}
        </span>
        {isDirectory && fileCount > 0 && (
          <span className="text-xs bg-surface-light px-1.5 py-0.5 rounded text-gray-400 flex-shrink-0">
            {fileCount}
          </span>
        )}
        {!isDirectory && file.size && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatFileSize(file.size)}
          </span>
        )}
        {isMentioned && (
          <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-secondary flex-shrink-0" title="Mentioned by Bob">
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
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
        <Folder className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-sm">No repository analyzed yet</p>
        <p className="text-xs mt-2">Enter a GitHub URL above to get started</p>
      </div>
    )
  }

  const tree = organizeFiles(files)
  const totalFiles = files.filter(f => f.type === 'file').length
  const mentionedCount = mentionedFiles.length

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-surface-light">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          File Explorer
        </h2>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{totalFiles} files</span>
          {mentionedCount > 0 && (
            <span className="flex items-center gap-1 text-secondary">
              <span>✨</span>
              {mentionedCount} mentioned
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderTree(tree)}
      </div>
      
      {/* Legend */}
      <div className="px-4 py-3 border-t border-surface-light bg-surface">
        <p className="text-xs text-gray-500 mb-2">File Types:</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span>🐍</span>
            <span className="text-gray-400">Python</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚛️</span>
            <span className="text-gray-400">React</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📄</span>
            <span className="text-gray-400">JS</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🎨</span>
            <span className="text-gray-400">CSS</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📋</span>
            <span className="text-gray-400">JSON</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📝</span>
            <span className="text-gray-400">Markdown</span>
          </div>
        </div>
        {mentionedCount > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            ✨ = Mentioned by Bob AI
          </p>
        )}
      </div>
    </div>
  )
}

export default FileTree

// Made with Bob
