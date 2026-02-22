# 🎓 ANITS Alumni-Student Platform

A full-stack platform connecting ANITS college alumni and students through **AI-powered placement insights**, **real-time messaging**, **mock interviews**, and **mentorship matching** — powered by a Retrieval-Augmented Generation (RAG) engine built on Google Gemini.

---

## ✨ Features

| Feature | Description |
|---|---|
| **AI Placement Assistant** | RAG-powered chatbot using Gemini 2.5 Flash + semantic embeddings over 567+ placement records |
| **Real-Time Chat** | Socket.io-based direct messaging with typing indicators and read receipts |
| **Mentor Matching** | Smart alumni-student matching based on skills, branch, and interests |
| **Mock Interviews** | Schedule, conduct, and review mock interview sessions with seniors |
| **Admin Dashboard** | User management, analytics, and platform-wide engagement metrics |
| **Engagement & Leaderboard** | Gamified engagement tracking with a leaderboard |
| **Notifications** | In-app notification system for messages, matches, and interviews |
| **Profile Management** | Detailed user profiles with skills, bio, placement experience, and resume uploads |

---

## 🏗️ Architecture

```
alumini-student-platform/
├── client/                  # Frontend — React 19 + Vite + Tailwind CSS 4
│   ├── src/
│   │   ├── components/      # Navbar, ChatInterface, ProtectedRoute
│   │   ├── pages/           # 13 pages (Home, AI, Chat, Login, Register, etc.)
│   │   ├── context/         # AuthContext (JWT-based auth state)
│   │   └── utils/           # Shared utilities
│   ├── Dockerfile
│   └── package.json
│
├── server/                  # Backend — Node.js + Express 5
│   ├── models/              # 11 Mongoose models
│   ├── routes/              # 10 route modules
│   ├── middleware/           # JWT auth middleware
│   ├── ragEngine.js         # Gemini RAG engine with embedding search
│   ├── socket.js            # Socket.io real-time messaging
│   ├── db.js                # MongoDB connection manager
│   └── server.js            # Express app entry point
│
├── scripts/                 # Data pipeline utilities
│   ├── extractData.js       # Extract raw data from PDF files
│   ├── processData.js       # Clean and structure extracted data
│   └── ingestData.js        # Generate embeddings and cache them
│
├── data/                    # Processed data & embedding cache
│   ├── raw_placement_data.json
│   ├── processed_placement_data.json
│   └── embeddings_cache.json
│
├── files/                   # Source PDF files (placement data, interview questions)
├── uploads/                 # User-uploaded files (resumes, etc.)
├── docker-compose.yml       # Full-stack Docker orchestration
├── Dockerfile               # Backend Docker image
└── .env.example             # Environment variable template
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite 7
- **Tailwind CSS 4** for styling
- **React Router 7** for client-side routing
- **Socket.io Client** for real-time features
- **Axios** for HTTP requests
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **React Markdown** for rendering AI responses

### Backend
- **Node.js 20** with **Express 5**
- **MongoDB** (via Mongoose 8) — primary database
- **Redis** — Socket.io adapter & session store
- **Socket.io** — real-time bidirectional messaging
- **Google Gemini AI** — `gemini-2.5-flash` for generation, `gemini-embedding-001` for embeddings
- **JWT** (jsonwebtoken + bcryptjs) — authentication
- **Multer** — file uploads
- **pdf-parse** — PDF text extraction
- **xlsx** — Excel file parsing

### Infrastructure
- **Docker** & **Docker Compose** — containerized deployment
- **Node 20 Alpine** base images

---

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | 20+ | [Download](https://nodejs.org/) |
| **npm** | 10+ | Bundled with Node.js |
| **MongoDB** | 7+ | Local install **or** [MongoDB Atlas](https://www.mongodb.com/atlas) |
| **Redis** | 7+ | Required for Socket.io adapter |
| **Docker** *(optional)* | 24+ | For containerized setup |
| **Google AI Studio API Key** | — | [Get one here](https://aistudio.google.com/apikey) |

---

## 🚀 Getting Started

### Option 1: Docker Compose (Recommended)

This is the easiest way to get everything running — MongoDB, Redis, backend, and frontend are all containerized.

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/alumini-student-platform.git
cd alumini-student-platform
```

#### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your-actual-gemini-api-key
```

> [!IMPORTANT]
> The rest of the variables (MongoDB URL, Redis URL, JWT secret) are pre-configured for Docker in `docker-compose.yml`. You only need to set `GEMINI_API_KEY` in `.env`.

#### 3. Start all services

```bash
docker-compose up --build
```

#### 4. Access the application

| Service | URL |
|---|---|
| **Frontend** | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | [http://localhost:3000](http://localhost:3000) |
| **Health Check** | [http://localhost:3000/health](http://localhost:3000/health) |
| **MongoDB** | `localhost:27017` |
| **Redis** | `localhost:6379` |

#### 5. (Optional) Seed the database

```bash
docker exec -it asp-backend npm run seed
```

---

### Option 2: Local Development (Manual Setup)

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/alumini-student-platform.git
cd alumini-student-platform
```

#### 2. Install backend dependencies

```bash
npm install
```

#### 3. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

#### 4. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Gemini AI (required)
GEMINI_API_KEY=your-actual-gemini-api-key

# MongoDB — use your local instance or Atlas URL
MONGO_DB_URL=mongodb://admin:admin123@localhost:27017/alumni_student_platform?authSource=admin

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

#### 5. Start MongoDB and Redis

If running locally, make sure both services are active:

```bash
# MongoDB (if installed locally)
mongod

# Redis (if installed locally)
redis-server
```

Or use Docker for just the databases:

```bash
docker run -d --name mongo -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:7

docker run -d --name redis -p 6379:6379 redis:7-alpine
```

#### 6. Seed the database (optional)

```bash
npm run seed
```

#### 7. Start the backend server

```bash
npm start
```

The backend starts on [http://localhost:3000](http://localhost:3000).

#### 8. Start the frontend dev server

In a separate terminal:

```bash
cd client
npm run dev
```

The frontend starts on [http://localhost:5173](http://localhost:5173) with API proxying to the backend.

---

## 📊 Data Pipeline

The platform includes a data ingestion pipeline to extract, process, and embed placement data from PDF files for the RAG engine.

### Pipeline Steps

```
PDF files (files/)  →  extractData.js  →  raw_placement_data.json
                                               ↓
                                        processData.js  →  processed_placement_data.json
                                                                    ↓
                                                             ingestData.js  →  embeddings_cache.json
```

### Running the Pipeline

#### Step 1: Extract raw data from PDFs

```bash
npm run extract
```

Parses the PDF files in `files/` and outputs `data/raw_placement_data.json`.

#### Step 2: Process and structure the data

```bash
npm run process
```

Cleans, structures, and augments the raw data. Outputs `data/processed_placement_data.json`.

#### Step 3: Generate embeddings

```bash
npm run ingest
```

Generates vector embeddings using Gemini's `gemini-embedding-001` model and caches them to `data/embeddings_cache.json`.

> [!NOTE]
> The embedding generation step calls the Gemini API in batches of 10 with a 1-second delay between batches. For ~567 records, this takes a few minutes. Once cached, embeddings are loaded from disk on subsequent server starts.

---

## 🔌 API Reference

All API routes are prefixed with `/api`.

| Endpoint | Description |
|---|---|
| `POST /api/auth/register` | Register a new user |
| `POST /api/auth/login` | Login and receive JWT |
| `GET /api/profiles` | List user profiles |
| `GET /api/profiles/:id` | Get a single profile |
| `PUT /api/profiles/:id` | Update profile |
| `GET /api/match` | Get mentor/mentee matches |
| `POST /api/chat` | Send a message to the AI chatbot (legacy) |
| `GET /api/messages/:userId` | Get direct messages with a user |
| `POST /api/interviews` | Create a mock interview session |
| `GET /api/interviews` | List interview sessions |
| `GET /api/notifications` | Get user notifications |
| `GET /api/engagement` | Get engagement metrics |
| `POST /api/rag/query` | RAG-powered placement query |
| `GET /api/admin/*` | Admin-only management routes |
| `GET /health` | Server health check |

> [!TIP]
> All authenticated routes require a `Authorization: Bearer <token>` header. Obtain a token via the `/api/auth/login` endpoint.

---

## 🔐 Authentication

The platform uses **JWT-based authentication**:

1. Users register with name, email, password, and role (`student` or `alumni`)
2. On login, the server returns a signed JWT token
3. The frontend stores the token and includes it in all API requests
4. Socket.io connections are also authenticated via the JWT token in the handshake

---

## 🧪 Testing

### Test the Gemini API key

```bash
node scripts/testKey.js
```

### Test a RAG query

```bash
node test-query.js
```

### Health check

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2026-02-22T10:00:00.000Z"
}
```

---

## 🐳 Docker Reference

### Services

| Service | Container Name | Port | Image |
|---|---|---|---|
| MongoDB | `asp-mongodb` | 27017 | `mongo:7` |
| Redis | `asp-redis` | 6379 | `redis:7-alpine` |
| Backend | `asp-backend` | 3000 | Custom (Node 20 Alpine) |
| Frontend | `asp-frontend` | 5173 | Custom (Node 20 Alpine) |

### Useful Commands

```bash
# Start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Rebuild a single service
docker-compose up --build backend

# Access backend container shell
docker exec -it asp-backend sh
```

---

## 📁 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | — | Google AI Studio API key for Gemini models |
| `MONGO_DB_URL` | ✅ | — | MongoDB connection string |
| `REDIS_URL` | ❌ | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | ✅ | — | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | ❌ | `7d` | Token expiration duration |
| `PORT` | ❌ | `3000` | Backend server port |
| `NODE_ENV` | ❌ | `development` | Environment mode |

---

## 🛣️ Frontend Routes

| Path | Page | Auth Required |
|---|---|---|
| `/login` | Login / Register | ❌ |
| `/` | Home Dashboard | ✅ |
| `/chat/:seniorId?` | Direct Messages | ✅ |
| `/ai` | AI Placement Assistant | ✅ |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 🙋 Troubleshooting

<details>
<summary><strong>MongoDB connection refused</strong></summary>

Ensure MongoDB is running on port 27017. If using Docker:

```bash
docker run -d --name mongo -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:7
```

</details>

<details>
<summary><strong>CORS errors in the browser</strong></summary>

The backend is configured to accept requests from `http://localhost:5173` and `http://localhost:3000`. If you're running the frontend on a different port, update the `cors` origin list in `server/server.js`.

</details>

<details>
<summary><strong>Gemini API rate limits</strong></summary>

The embedding generation script throttles requests (10 per batch with 1s delays). If you still hit rate limits, increase the delay in `scripts/ingestData.js` or `server/ragEngine.js`.

</details>

<details>
<summary><strong>RAG engine returns empty results</strong></summary>

Make sure you've run the full data pipeline:

```bash
npm run extract
npm run process
npm run ingest
```

Then restart the server so embeddings are loaded from the cache.

</details>

<details>
<summary><strong>Frontend proxy not working</strong></summary>

The Vite dev server proxies `/api` requests to `http://localhost:3000`. Ensure the backend is running before starting the frontend. Check `client/vite.config.js` if you need to change the proxy target.

</details>
