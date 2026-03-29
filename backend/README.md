# ChatApp Backend

FastAPI backend for a real-time chat application with WebSocket support, JWT authentication, and Gemini AI integration.

## Tech Stack

- **Framework:** FastAPI
- **Database:** SQLite (dev) / Supabase PostgreSQL (prod)
- **ORM:** SQLAlchemy (SQLite mode)
- **Auth:** JWT + Google OAuth
- **Real-time:** WebSocket
- **AI:** Google Gemini

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── config.py                # Environment variables
│   ├── database/
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── session.py           # SQLite engine & session factory
│   │   ├── repository.py        # Data access layer (SQLite + Supabase)
│   │   └── supabase.py          # Supabase client
│   ├── schemas/
│   │   ├── auth.py              # Auth request/response models
│   │   ├── user.py              # User response model
│   │   ├── chat.py              # Chat create/response models
│   │   └── message.py           # Message & AI message models
│   ├── security/
│   │   ├── jwt.py               # Token creation & verification
│   │   ├── password.py          # bcrypt hash & verify
│   │   └── dependencies.py      # FastAPI auth dependency
│   ├── services/
│   │   ├── auth_service.py      # Register, login, Google OAuth
│   │   ├── user_service.py      # User listing & search
│   │   ├── chat_service.py      # Chat CRUD, AI chat
│   │   ├── message_service.py   # Message CRUD, read receipts
│   │   └── ai_service.py        # Gemini AI chat
│   ├── routes/
│   │   ├── auth.py              # /api/auth/*
│   │   ├── users.py             # /api/users/*
│   │   ├── chats.py             # /api/chats/*
│   │   ├── messages.py          # /api/messages/*
│   │   └── ai.py                # /api/ai/*
│   └── websocket/
│       └── manager.py           # WebSocket connection manager
├── supabase_schema.sql          # SQL schema for Supabase
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

### 1. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_MODE` | `sqlite` (dev) or `supabase` (prod) | Yes |
| `SQLITE_URL` | SQLite connection string | Dev only |
| `SUPABASE_URL` | Supabase project URL | Prod only |
| `SUPABASE_KEY` | Supabase anon key | Prod only |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Prod only |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GEMINI_API_KEY` | Google Gemini API key | Optional |
| `FRONTEND_URL` | Frontend origin for CORS | Yes |

### 3. Run the server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. SQLite tables are created automatically on startup.

### 4. Supabase setup (production)

Run `supabase_schema.sql` in the Supabase SQL Editor to create the tables, then set `DATABASE_MODE=supabase` in `.env`.

## API Reference

All endpoints (except auth) require a `Bearer` token in the `Authorization` header.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register with email/password |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/google` | Login with Google OAuth token |
| `GET` | `/api/auth/me` | Get current user profile |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/` | List all users (excluding self) |
| `GET` | `/api/users/search?q=` | Search users by name |
| `GET` | `/api/users/{user_id}` | Get user by ID |

### Chats

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/chats/` | List user's chats with participants & last message |
| `POST` | `/api/chats/` | Create or get existing 1-on-1 chat |
| `POST` | `/api/chats/ai` | Create or get existing AI chat |
| `GET` | `/api/chats/{chat_id}` | Get chat by ID |
| `DELETE` | `/api/chats/{chat_id}` | Delete a chat |

### Messages

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/messages/{chat_id}` | Get messages for a chat |
| `POST` | `/api/messages/` | Send a message |
| `PUT` | `/api/messages/read/{chat_id}` | Mark messages as read |

### AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Send a message to Gemini AI |

### WebSocket

Connect to `ws://localhost:8000/ws/{jwt_token}` for real-time features.

**Message types (client -> server):**

```json
// Send a message
{ "type": "message", "chat_id": "...", "content": "...", "message_type": "text" }

// Typing indicator
{ "type": "typing", "chat_id": "...", "is_typing": true }

// Mark messages as read
{ "type": "read", "chat_id": "..." }
```

**Event types (server -> client):**

```json
// New message received
{ "type": "new_message", "message": { ... } }

// User online/offline status
{ "type": "user_status", "user_id": "...", "is_online": true }

// Typing indicator
{ "type": "typing", "chat_id": "...", "user_id": "...", "is_typing": true }

// Messages read by other user
{ "type": "messages_read", "chat_id": "...", "reader_id": "..." }
```

## Database Modes

The app uses a repository pattern (`database/repository.py`) that abstracts database operations. Each function has dual implementations:

- **SQLite mode** — uses SQLAlchemy ORM, auto-creates tables on startup, stores data in `chatapp.db`
- **Supabase mode** — uses the Supabase Python client, requires tables created via `supabase_schema.sql`

Switch between modes by setting `DATABASE_MODE` in `.env`.

## Deployment

### Railway

```bash
# railway.json is not required — Railway auto-detects FastAPI
# Set environment variables in the Railway dashboard
# Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Render

Set the start command to:
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Docker

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
