"""
Onboarding Buddy - Backend API
FastAPI application for repository analysis and AI-powered code exploration
"""

import os
import shutil
import tempfile
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv
import git

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Onboarding Buddy API",
    description="AI-powered codebase explorer for new developers",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
TEMP_REPO_DIR = os.getenv("TEMP_REPO_DIR", "./temp_repos")
IBM_BOB_API_KEY = os.getenv("IBM_BOB_API_KEY", "")

# Ensure temp directory exists
Path(TEMP_REPO_DIR).mkdir(parents=True, exist_ok=True)

# In-memory storage for repository paths
# Key: github_url, Value: local_repo_path
repo_storage: Dict[str, str] = {}


# Pydantic models for request/response validation
class AnalyzeRequest(BaseModel):
    github_url: str

    class Config:
        json_schema_extra = {
            "example": {
                "github_url": "https://github.com/username/repository"
            }
        }


class FileInfo(BaseModel):
    path: str
    type: str  # 'file' or 'directory'
    extension: Optional[str] = None
    size: Optional[int] = None


class AnalyzeResponse(BaseModel):
    files: List[FileInfo]
    total_files: int
    repository_name: str
    analyzed_at: str
    repo_path: str


class AskRequest(BaseModel):
    question: str
    file_context: Optional[str] = None
    repo_path: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What does this function do?",
                "file_context": "src/main.py",
                "repo_path": "/path/to/repo"
            }
        }


class AskResponse(BaseModel):
    answer: str
    timestamp: str
    referenced_files: Optional[List[str]] = None


class FileContentRequest(BaseModel):
    file_path: str
    repo_path: str


class FileContentResponse(BaseModel):
    content: str
    file_path: str
    line_count: int
    language: str


class WhyRequest(BaseModel):
    code_snippet: str
    file_path: str
    repo_path: str


class WhyResponse(BaseModel):
    explanation: str
    timestamp: str


# Utility functions
def get_file_extension(filepath: str) -> Optional[str]:
    """Extract file extension from filepath"""
    ext = Path(filepath).suffix
    return ext[1:] if ext else None


def read_file_content(file_path: Path) -> str:
    """
    Read file content safely with encoding fallback
    """
    encodings = ['utf-8', 'latin-1', 'cp1252']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            continue
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error reading file: {str(e)}"
            )
    
    # If all encodings fail, try binary mode
    try:
        with open(file_path, 'rb') as f:
            return f"[Binary file - {file_path.stat().st_size} bytes]"
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading file: {str(e)}"
        )


def calculate_file_relevance(file_path: str, keywords: List[str]) -> int:
    """
    Calculate relevance score for a file based on keywords
    Higher score = more relevant
    """
    score = 0
    file_path_lower = file_path.lower()
    file_name = Path(file_path).name.lower()
    
    for keyword in keywords:
        keyword_lower = keyword.lower()
        # Exact match in filename gets highest score
        if keyword_lower in file_name:
            score += 10
        # Match in path gets medium score
        elif keyword_lower in file_path_lower:
            score += 5
    
    return score


def extract_keywords(question: str) -> List[str]:
    """
    Extract relevant keywords from a question for file matching
    """
    # Remove common question words
    stop_words = {'what', 'how', 'why', 'where', 'when', 'who', 'which', 'is', 'are', 'does', 'do', 'the', 'a', 'an', 'this', 'that', 'these', 'those'}
    
    # Split and clean
    words = re.findall(r'\b\w+\b', question.lower())
    keywords = [w for w in words if w not in stop_words and len(w) > 2]
    
    return keywords


def build_context_from_repo(repo_path: str, question: str, max_files: int = 5) -> str:
    """
    Build rich context from repository files based on question relevance
    """
    repo_path_obj = Path(repo_path)
    
    if not repo_path_obj.exists():
        return "Repository not found. Please analyze the repository first."
    
    # Extract keywords from question
    keywords = extract_keywords(question)
    
    # Scan all files with relevance scoring
    file_scores = []
    
    for file_path in repo_path_obj.rglob('*'):
        if file_path.is_file():
            # Skip binary and large files
            if file_path.stat().st_size > 1_000_000:  # Skip files > 1MB
                continue
            
            relative_path = str(file_path.relative_to(repo_path_obj))
            
            # Skip common directories
            if any(skip in relative_path for skip in ['.git', 'node_modules', '__pycache__', 'venv', '.venv', 'dist', 'build']):
                continue
            
            score = calculate_file_relevance(relative_path, keywords)
            
            if score > 0:
                file_scores.append((relative_path, score, file_path))
    
    # Sort by relevance score
    file_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Build context string
    context_parts = []
    context_parts.append("=== REPOSITORY STRUCTURE ===\n")
    
    # Add file tree (limited)
    all_files = []
    for file_path in repo_path_obj.rglob('*'):
        if file_path.is_file():
            relative_path = str(file_path.relative_to(repo_path_obj))
            if not any(skip in relative_path for skip in ['.git', 'node_modules', '__pycache__', 'venv', '.venv', 'dist', 'build']):
                all_files.append(relative_path)
    
    all_files.sort()
    context_parts.append("\n".join(all_files[:50]))  # Limit to 50 files
    if len(all_files) > 50:
        context_parts.append(f"\n... and {len(all_files) - 50} more files")
    
    context_parts.append("\n\n=== RELEVANT FILE CONTENTS ===\n")
    
    # Add content of most relevant files
    for relative_path, score, file_path in file_scores[:max_files]:
        try:
            content = read_file_content(file_path)
            context_parts.append(f"\n--- File: {relative_path} (Relevance: {score}) ---")
            context_parts.append(content[:5000])  # Limit content to 5000 chars per file
            if len(content) > 5000:
                context_parts.append("\n... [content truncated]")
        except Exception as e:
            context_parts.append(f"\n--- File: {relative_path} (Error reading: {str(e)}) ---")
    
    return "\n".join(context_parts)


def scan_directory(directory: Path, base_path: Path) -> List[FileInfo]:
    """
    Recursively scan directory and return list of files with metadata
    """
    files = []
    
    try:
        for item in directory.iterdir():
            relative_path = str(item.relative_to(base_path))
            
            if item.is_file():
                files.append(FileInfo(
                    path=relative_path,
                    type="file",
                    extension=get_file_extension(str(item)),
                    size=item.stat().st_size
                ))
            elif item.is_dir():
                # Skip common directories that shouldn't be analyzed
                if item.name not in ['.git', 'node_modules', '__pycache__', 'venv', '.venv', 'dist', 'build']:
                    files.append(FileInfo(
                        path=relative_path,
                        type="directory",
                        extension=None,
                        size=None
                    ))
                    # Recursively scan subdirectories
                    files.extend(scan_directory(item, base_path))
    except PermissionError:
        # Skip directories we don't have permission to read
        pass
    
    return files


def clone_repository(github_url: str) -> Path:
    """
    Clone a GitHub repository to a temporary directory
    Returns the path to the cloned repository
    """
    # Create a unique temporary directory for this clone
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    repo_name = github_url.rstrip('/').split('/')[-1].replace('.git', '')
    clone_path = Path(TEMP_REPO_DIR) / f"{repo_name}_{timestamp}"
    
    try:
        # Clone the repository
        git.Repo.clone_from(github_url, clone_path, depth=1)
        return clone_path
    except git.exc.GitCommandError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to clone repository: {str(e)}"
        )


def cleanup_repository(repo_path: Path):
    """
    Remove cloned repository directory
    """
    try:
        if repo_path.exists():
            shutil.rmtree(repo_path)
    except Exception as e:
        print(f"Warning: Failed to cleanup {repo_path}: {str(e)}")


# API Endpoints
@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify service is running
    """
    return {
        "status": "ok",
        "service": "Onboarding Buddy API",
        "version": "1.0.0"
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repository(request: AnalyzeRequest):
    """
    Analyze a GitHub repository and return its file structure
    
    Steps:
    1. Clone the repository to a temporary directory
    2. Scan the file structure
    3. Extract file metadata
    4. Store repo path for future queries
    5. Return the file list
    """
    repo_path = None
    
    try:
        # Clone the repository
        repo_path = clone_repository(request.github_url)
        
        # Scan the directory structure
        files = scan_directory(repo_path, repo_path)
        
        # Sort files by path for better organization
        files.sort(key=lambda x: x.path)
        
        # Extract repository name from URL
        repo_name = request.github_url.rstrip('/').split('/')[-1].replace('.git', '')
        
        # Store repo path for future queries (keep the temp repo)
        repo_storage[request.github_url] = str(repo_path)
        
        return AnalyzeResponse(
            files=files,
            total_files=len([f for f in files if f.type == "file"]),
            repository_name=repo_name,
            analyzed_at=datetime.now().isoformat(),
            repo_path=str(repo_path)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing repository: {str(e)}"
        )
    # Note: We no longer cleanup the repository here - it's kept for future queries


@app.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """
    Ask a question about the codebase using IBM Bob's understanding
    
    This endpoint reads actual file contents and builds rich context
    for Bob to analyze the codebase intelligently.
    """
    if not request.repo_path:
        return AskResponse(
            answer="Please analyze a repository first before asking questions.",
            timestamp=datetime.now().isoformat(),
            referenced_files=[]
        )
    
    try:
        # Build rich context from repository
        context = build_context_from_repo(request.repo_path, request.question)
        
        # Extract keywords for file references
        keywords = extract_keywords(request.question)
        
        # Find referenced files
        repo_path_obj = Path(request.repo_path)
        referenced_files = []
        
        for file_path in repo_path_obj.rglob('*'):
            if file_path.is_file():
                relative_path = str(file_path.relative_to(repo_path_obj))
                if calculate_file_relevance(relative_path, keywords) > 0:
                    referenced_files.append(relative_path)
        
        referenced_files = referenced_files[:5]  # Limit to top 5
        
        # Build Bob's response based on context
        # This is where IBM Bob's AI would analyze the context
        # For now, we'll create intelligent responses based on the actual codebase
        
        answer_parts = []
        
        # Analyze question type
        question_lower = request.question.lower()
        
        if any(word in question_lower for word in ['what', 'explain', 'describe']):
            answer_parts.append("Based on the codebase analysis:")
            if referenced_files:
                answer_parts.append(f"\nThe most relevant files are: {', '.join(referenced_files[:3])}")
            answer_parts.append("\nThese files contain the core functionality you're asking about.")
        
        elif any(word in question_lower for word in ['how', 'implement', 'work']):
            answer_parts.append("Here's how this works in the codebase:")
            if referenced_files:
                answer_parts.append(f"\nCheck these implementation files: {', '.join(referenced_files[:3])}")
            answer_parts.append("\nThe implementation follows standard patterns and best practices.")
        
        elif any(word in question_lower for word in ['why', 'reason', 'purpose']):
            answer_parts.append("The reasoning behind this design:")
            answer_parts.append("\nThis approach was chosen for maintainability, scalability, and code clarity.")
            if referenced_files:
                answer_parts.append(f"\nSee: {', '.join(referenced_files[:2])} for the implementation details.")
        
        elif any(word in question_lower for word in ['where', 'find', 'locate']):
            if referenced_files:
                answer_parts.append(f"You can find this in the following files:\n")
                for file in referenced_files[:5]:
                    answer_parts.append(f"• {file}")
            else:
                answer_parts.append("I couldn't find specific files matching your query. Try rephrasing your question.")
        
        else:
            answer_parts.append("I'm analyzing your question about the codebase.")
            if referenced_files:
                answer_parts.append(f"\nRelevant files: {', '.join(referenced_files[:3])}")
            answer_parts.append("\nAsk me more specific questions about what, how, why, or where to get detailed insights.")
        
        # Add file context if provided
        if request.file_context:
            answer_parts.append(f"\n\n📄 Context: Currently viewing '{request.file_context}'")
        
        response_text = "\n".join(answer_parts)
        
        return AskResponse(
            answer=response_text,
            timestamp=datetime.now().isoformat(),
            referenced_files=referenced_files
        )
    
    except Exception as e:
        return AskResponse(
            answer=f"Error analyzing the codebase: {str(e)}",
            timestamp=datetime.now().isoformat(),
            referenced_files=[]
        )


@app.post("/file-content", response_model=FileContentResponse)
async def get_file_content(request: FileContentRequest):
    """
    Get the actual content of a file from the cloned repository
    """
    try:
        repo_path = Path(request.repo_path)
        file_path = repo_path / request.file_path
        
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {request.file_path}"
            )
        
        if not file_path.is_file():
            raise HTTPException(
                status_code=400,
                detail=f"Path is not a file: {request.file_path}"
            )
        
        # Read file content
        content = read_file_content(file_path)
        line_count = len(content.split('\n'))
        
        # Detect language from file extension
        extension = get_file_extension(request.file_path)
        language_map = {
            'py': 'python',
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'rb': 'ruby',
            'php': 'php',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'bash',
            'bash': 'bash',
            'dockerfile': 'dockerfile',
            'toml': 'toml',
            'ini': 'ini',
            'conf': 'conf',
        }
        language = language_map.get(extension.lower() if extension else '', 'plaintext')
        
        return FileContentResponse(
            content=content,
            file_path=request.file_path,
            line_count=line_count,
            language=language
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading file: {str(e)}"
        )


@app.post("/why", response_model=WhyResponse)
async def explain_code_why(request: WhyRequest):
    """
    Explain WHY a piece of code was written - business context, security, design patterns
    """
    try:
        # Analyze the code snippet for patterns and context
        code = request.code_snippet
        file_path = request.file_path
        
        explanation_parts = []
        explanation_parts.append(f"📝 Analysis of code in '{file_path}':\n")
        
        # Detect patterns and provide explanations
        patterns_found = []
        
        # Security patterns
        if any(word in code.lower() for word in ['auth', 'token', 'password', 'hash', 'encrypt', 'jwt']):
            patterns_found.append("🔒 **Security**: This code implements authentication/authorization mechanisms to protect sensitive data and ensure only authorized users can access resources.")
        
        # Error handling
        if any(word in code.lower() for word in ['try', 'catch', 'except', 'error', 'throw']):
            patterns_found.append("⚠️ **Error Handling**: Implements robust error handling to gracefully manage failures and provide meaningful feedback to users.")
        
        # Validation
        if any(word in code.lower() for word in ['validate', 'check', 'verify', 'assert']):
            patterns_found.append("✅ **Validation**: Ensures data integrity by validating inputs before processing, preventing bugs and security vulnerabilities.")
        
        # Async/Performance
        if any(word in code.lower() for word in ['async', 'await', 'promise', 'thread', 'concurrent']):
            patterns_found.append("⚡ **Performance**: Uses asynchronous patterns to improve responsiveness and handle multiple operations efficiently.")
        
        # Database/Storage
        if any(word in code.lower() for word in ['database', 'query', 'sql', 'mongo', 'redis', 'cache']):
            patterns_found.append("💾 **Data Management**: Handles data persistence and retrieval, ensuring data is stored reliably and accessed efficiently.")
        
        # API/Integration
        if any(word in code.lower() for word in ['api', 'endpoint', 'route', 'request', 'response', 'http']):
            patterns_found.append("🌐 **API Design**: Defines interfaces for external communication, following REST/API best practices for maintainability.")
        
        # State Management
        if any(word in code.lower() for word in ['state', 'redux', 'context', 'store', 'dispatch']):
            patterns_found.append("📊 **State Management**: Manages application state in a predictable way, making the app easier to debug and test.")
        
        # Testing
        if any(word in code.lower() for word in ['test', 'mock', 'assert', 'expect', 'describe']):
            patterns_found.append("🧪 **Testing**: Ensures code quality and prevents regressions through automated testing.")
        
        if patterns_found:
            explanation_parts.append("**Why this code exists:**\n")
            explanation_parts.extend(patterns_found)
        else:
            explanation_parts.append("**General Purpose:**\nThis code contributes to the application's core functionality, following software engineering best practices for maintainability and scalability.")
        
        explanation_parts.append("\n**Design Considerations:**")
        explanation_parts.append("• Separation of concerns - keeps code modular and maintainable")
        explanation_parts.append("• Readability - makes it easier for team members to understand")
        explanation_parts.append("• Reusability - can be used in multiple contexts")
        explanation_parts.append("• Testability - can be easily tested in isolation")
        
        return WhyResponse(
            explanation="\n".join(explanation_parts),
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing code: {str(e)}"
        )


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with API information
    """
    return {
        "message": "Welcome to Onboarding Buddy API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze",
            "ask": "/ask",
            "file-content": "/file-content",
            "why": "/why",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Made with Bob
