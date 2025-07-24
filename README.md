# 📚 RAG Document-Based Chatbot

A powerful **Retrieval-Augmented Generation (RAG)** chatbot that allows users to upload PDF documents and ask intelligent questions about their content. Built with modern technologies for seamless document processing and conversational AI.

![RAG Chatbot](https://img.shields.io/badge/RAG-Chatbot-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.4.3-black?style=for-the-badge&logo=next.js)
![Express](https://img.shields.io/badge/Express-5.1.0-green?style=for-the-badge&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

## 🚀 Features

- **📄 PDF Upload & Processing**: Upload PDF documents for intelligent analysis
- **🤖 AI-Powered Chat**: Ask questions and get accurate answers from your documents
- **🔍 Semantic Search**: Advanced vector-based document retrieval using Qdrant
- **📚 Document Chunking**: Smart text splitting for optimal context understanding
- **🎯 Source Citations**: See exactly which pages and documents your answers come from
- **⚡ Real-time Processing**: Background job processing with Redis and BullMQ
- **🎨 Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │ -> │  Express API    │ -> │   Vector DB     │
│   (Frontend)    │    │   (Backend)     │    │   (Qdrant)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Job Queue     │
                       │ (Redis+BullMQ)  │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend

- **Next.js 15.4.3** - React framework with Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **Clerk** - Authentication (optional)

### Backend

- **Express.js 5.1.0** - Web framework
- **Multer** - File upload handling
- **LangChain** - Document processing and AI orchestration
- **Qdrant** - Vector database for embeddings
- **Redis + BullMQ** - Job queue for background processing

### AI & ML

- **HuggingFace Transformers** - Text embeddings (all-MiniLM-L6-v2)
- **OpenAI Embeddings** - Alternative embedding model
- **PDF Loader** - Document parsing and text extraction

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Redis server
- Qdrant vector database

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Document Based Chatbot"
```

### 2. Setup Backend

```bash
cd server
npm install

# Create environment file
echo "QDRANT_URL=http://localhost:6333" > .env
echo "OPENAI_API_KEY=your_openai_api_key" >> .env
```

### 3. Setup Frontend

```bash
cd ../client
npm install
```

### 4. Start Services

**Start Redis:**

```bash
# Windows (if using Redis on Windows)
redis-server

# MacOS/Linux
brew services start redis
# or
sudo systemctl start redis
```

**Start Qdrant:**

```bash
# Using Docker
docker run -p 6333:6333 qdrant/qdrant

# Or visit: http://localhost:6333/dashboard
```

### 5. Run the Application

**Backend:**

```bash
cd server
npm run dev
```

**Frontend:**

```bash
cd client
npm run dev
```

Visit `http://localhost:3000` to access the application!

## 🎯 Usage

### 1. Upload Documents

- Navigate to the upload page
- Select PDF files to upload
- Files are automatically processed in the background

### 2. Chat with Your Documents

- Go to the chat interface
- Ask questions about your uploaded documents
- Get AI-powered answers with source citations

### Example Queries:

- "What are the main themes in this book?"
- "Summarize chapter 3"
- "What does the author say about habit formation?"

## 🔧 Configuration

### Environment Variables

**Server (.env):**

```env
QDRANT_URL=http://localhost:6333
OPENAI_API_KEY=your_openai_api_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Embedding Models

The project supports multiple embedding models:

```javascript
// HuggingFace (Local, Free)
const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

// OpenAI (API-based, Paid)
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-small",
});
```

## 📁 Project Structure

```
Document Based Chatbot/
├── client/                 # Next.js frontend
│   ├── app/
│   │   ├── components/     # React components
│   │   │   ├── chat.tsx   # Chat interface
│   │   │   └── file-upload.tsx
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # App layout
│   │   └── page.tsx       # Home page
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Express.js backend
│   ├── uploads/           # Uploaded files storage
│   ├── index.js          # Main server file
│   ├── worker.js         # Background job processor
│   └── package.json
└── README.md
```

## 🔄 How It Works

1. **Document Upload**: User uploads PDF files via the frontend
2. **File Processing**: Multer saves files to `/uploads` directory
3. **Background Processing**: BullMQ queues the document for processing
4. **Text Extraction**: PDF content is extracted using LangChain's PDFLoader
5. **Text Chunking**: Documents are split into smaller, manageable chunks
6. **Embedding Generation**: Each chunk is converted to vector embeddings
7. **Vector Storage**: Embeddings are stored in Qdrant vector database
8. **Query Processing**: User questions are embedded and matched against stored vectors
9. **Response Generation**: Relevant chunks are retrieved and used to generate contextual answers

## 🐛 Troubleshooting

### Common Issues

**1. "Collection doesn't exist" error:**

```javascript
// Use fromDocuments instead of fromExistingCollection
const vectorStore = await QdrantVectorStore.fromDocuments(
  texts,
  embeddings,
  config
);
```

**2. ES Module warnings:**
Add to server/package.json:

```json
{
  "type": "module"
}
```

**3. Redis connection issues:**

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

**4. Qdrant connection issues:**

```bash
# Check Qdrant dashboard
curl http://localhost:6333/collections
```

## 🚀 Deployment

### Using Docker Compose

```yaml
version: "3.8"
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"

  app:
    build: .
    ports:
      - "3000:3000"
      - "8000:8000"
    depends_on:
      - redis
      - qdrant
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LangChain](https://langchain.com/) for document processing utilities
- [Qdrant](https://qdrant.tech/) for vector database capabilities
- [HuggingFace](https://huggingface.co/) for transformer models
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [Issues](../../issues)
3. Create a new issue with detailed information

---

**Happy chatting with your documents! 📚🤖**
