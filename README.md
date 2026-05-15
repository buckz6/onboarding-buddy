# 🚀 Onboarding Buddy

**AI-Powered Codebase Explorer** - Understand unfamiliar codebases instantly with the help of IBM Bob AI.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📖 Overview

Onboarding Buddy is a web application designed to help new developers quickly understand and navigate unfamiliar codebases. By combining repository analysis with IBM Bob's AI capabilities, it provides an interactive way to explore code, ask questions, and get instant insights.

### ✨ Key Features

- 🔍 **Repository Analysis** - Clone and analyze any public GitHub repository
- 📁 **Interactive File Tree** - Navigate through the codebase with an intuitive file explorer
- 💬 **AI Chat Interface** - Ask questions about the code and get intelligent responses from IBM Bob
- 🎨 **Modern UI** - Clean, dark-themed interface built with React and Tailwind CSS
- ⚡ **Fast Performance** - Built with Vite for lightning-fast development and builds

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  FileTree    │  │ CodeViewer   │  │  ChatPanel   │  │
│  │  Component   │  │  Component   │  │  Component   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/REST API
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   /health    │  │   /analyze   │  │     /ask     │  │
│  │   endpoint   │  │   endpoint   │  │   endpoint   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   GitHub Repositories   │
              │      IBM Bob AI         │
              └────────────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Python 3.9+**
- **FastAPI** - Modern, fast web framework
- **GitPython** - Git repository operations
- **Uvicorn** - ASGI server
- **python-dotenv** - Environment management

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Deployment
- **Railway** - Cloud platform for deployment

## 🚀 Getting Started

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- Git
- IBM Bob API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/onboarding-buddy.git
   cd onboarding-buddy
   ```

2. **Set up the backend**
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create .env file
   cp .env.example .env
   # Edit .env and add your IBM_BOB_API_KEY
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   
   # Install dependencies
   npm install
   ```

### Running Locally

1. **Start the backend server**
   ```bash
   cd backend
   python main.py
   # Server will run on http://localhost:8000
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   # App will run on http://localhost:5173
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173` and start exploring!

## 📝 Usage

1. **Enter a GitHub Repository URL**
   - Paste any public GitHub repository URL in the input field
   - Click "Analyze Repository" to start the analysis

2. **Explore the File Tree**
   - Browse through the repository structure in the left sidebar
   - Click on files to view their information

3. **Ask Questions**
   - Use the chat panel on the right to ask questions about the codebase
   - IBM Bob AI will provide intelligent responses based on the context

## 🤖 How IBM Bob is Used

IBM Bob serves as the AI engine powering the intelligent code analysis features:

- **Code Understanding** - Bob analyzes code structure and provides explanations
- **Question Answering** - Responds to natural language questions about the codebase
- **Context-Aware Responses** - Uses file context to provide relevant answers
- **Best Practices** - Suggests improvements and explains design patterns

### Integration Points

1. **`/ask` Endpoint** - Forwards user questions to IBM Bob with file context
2. **Session Management** - Maintains conversation history in `bob_sessions/`
3. **Context Building** - Provides Bob with repository structure and file information

## 🚢 Deployment

### Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize project**
   ```bash
   railway init
   ```

4. **Set environment variables**
   ```bash
   railway variables set IBM_BOB_API_KEY=your_api_key_here
   ```

5. **Deploy**
   ```bash
   railway up
   ```

The `railway.toml` configuration file handles the build and deployment process automatically.

## 📁 Project Structure

```
onboarding-buddy/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main application file
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── main.jsx       # React entry point
│   │   ├── index.css      # Global styles
│   │   └── components/    # React components
│   │       ├── FileTree.jsx
│   │       ├── ChatPanel.jsx
│   │       └── CodeViewer.jsx
│   ├── package.json       # Node dependencies
│   ├── vite.config.js     # Vite configuration
│   ├── tailwind.config.js # Tailwind CSS config
│   └── index.html         # HTML entry point
├── bob_sessions/          # AI session storage
├── .gitignore            # Git ignore rules
├── README.md             # This file
└── railway.toml          # Railway deployment config
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
IBM_BOB_API_KEY=your_api_key_here
TEMP_REPO_DIR=./temp_repos
```

### Frontend Configuration

The frontend uses Vite's proxy configuration to communicate with the backend. See `frontend/vite.config.js` for details.

## 🎨 Customization

### Color Scheme

The application uses a custom color palette defined in `tailwind.config.js`:

- **Primary**: `#4F46E5` (Indigo) - Main actions and highlights
- **Secondary**: `#10B981` (Green) - Success states and accents
- **Background**: `#1F2937` (Dark Gray) - Main background

To customize, edit the `colors` section in `frontend/tailwind.config.js`.

## 🔮 Future Enhancements

- [ ] Monaco Editor integration for syntax highlighting
- [ ] File content reading and display
- [ ] Multi-file comparison
- [ ] Code search functionality
- [ ] Repository bookmarking
- [ ] Export conversation history
- [ ] Support for private repositories
- [ ] Advanced code navigation
- [ ] Collaborative features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **IBM Bob** - For providing the AI capabilities
- **FastAPI** - For the excellent Python web framework
- **React Team** - For the amazing UI library
- **Tailwind CSS** - For the utility-first CSS framework
- **Railway** - For easy deployment

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ by developers, for developers