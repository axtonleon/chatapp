# ChatApp Frontend

React + TypeScript frontend for a real-time chat application, built with Vite and styled with Tailwind CSS. UI matches the provided Figma designs.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Auth:** JWT + Google OAuth (`@react-oauth/google`)
- **Real-time:** Native WebSocket with auto-reconnect

## Project Structure

```
frontend/src/
├── lib/
│   ├── api.ts                   # Axios instance with JWT interceptor
│   └── websocket.ts             # WebSocket manager (connect, send, subscribe)
├── stores/
│   ├── authStore.ts             # Auth state (login, register, google, logout)
│   └── chatStore.ts             # Chat state (chats, messages, users, online status)
├── types/
│   └── index.ts                 # TypeScript interfaces (User, Message, Chat)
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx           # Global header (search, notifications, avatar)
│   │   └── Sidebar.tsx          # Left icon nav + user menu
│   ├── chat/
│   │   ├── ChatList.tsx         # Chat list with search, unread badges, context menu
│   │   ├── ChatArea.tsx         # Message display + header + typing indicators
│   │   ├── MessageBubble.tsx    # Sent/received message bubbles with read receipts
│   │   ├── MessageInput.tsx     # Input bar with action icons + send button
│   │   ├── ContactInfo.tsx      # Right panel (profile, audio/video, media/link/docs)
│   │   └── NewMessageModal.tsx  # User search dropdown to start new chats
│   └── ui/
│       ├── Avatar.tsx           # Avatar with initials fallback + online indicator
│       └── OnlineIndicator.tsx  # Green/gray online dot
├── pages/
│   ├── AuthPage.tsx             # Login/signup with Google OAuth + email/password
│   └── ChatPage.tsx             # Main layout composing all chat components
├── App.tsx                      # Router + Google OAuth provider + protected routes
├── main.tsx                     # Entry point
└── index.css                    # Tailwind directives + global styles
```

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_WS_URL` | Backend WebSocket URL | `ws://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |

### 3. Run dev server

```bash
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api` and `/ws` requests to the backend at `localhost:8000`.

### 4. Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Pages

### Auth Page (`/login`)

- Split-screen layout: branding on the left, form on the right
- Toggle between Sign In and Sign Up
- Email/password with confirm password on signup
- Password visibility toggle (eye icon)
- Google OAuth button
- Responsive — stacks on mobile

### Chat Page (`/chat`)

Protected route. Layout matches the Figma designs:

```
┌──────────┬──────────────────────────────────────────┐
│          │  TopBar (search, notifications, avatar)   │
│ Sidebar  ├───────────────┬──────────────────────────┤
│ (icons)  │  Chat List    │  Chat Area               │
│          │  - search     │  - contact header         │
│          │  - new msg    │  - messages               │
│          │  - chats      │  - typing indicator       │
│  AI, ⚙  │               │  - input bar              │
│  avatar  │               │  [Contact Info panel -->] │
└──────────┴───────────────┴──────────────────────────┘
```

## Key Features

### Real-time Messaging
Messages are sent via WebSocket and appear instantly for all chat participants. No polling.

### Online Status
User online/offline status is tracked via WebSocket connect/disconnect events and reflected with green/gray dots on avatars.

### Typing Indicators
Debounced typing events sent via WebSocket. Shows animated dots when the other user is typing.

### Read Receipts
Double checkmarks on messages — gray when delivered, green when read. Visible in both the chat area and chat list.

### AI Chat
Click the sparkle icon in the sidebar to open an AI chat powered by Gemini. Only one AI chat per user.

### Delete Chats
Right-click any chat in the list to delete it.

### Contact Info Panel
Click a user's avatar in the chat header to open the contact info panel with Media, Links, and Docs tabs.

## State Management

Two Zustand stores:

- **`authStore`** — user, token, login/register/logout actions, `loadUser` from localStorage on app mount
- **`chatStore`** — chats, messages, users, online status, all CRUD actions + WebSocket message handling

## API Integration

- **`lib/api.ts`** — Axios instance that auto-attaches the JWT token and redirects to `/login` on 401
- **`lib/websocket.ts`** — WebSocket manager with `.connect()`, `.send()`, `.on(type, handler)`, and auto-reconnect after 3 seconds

## Color Scheme

Defined in `tailwind.config.js`:

| Token | Value | Usage |
|---|---|---|
| `primary-500` | `#00A884` | Buttons, active states, sent checkmarks |
| `chat-bg` | `#f0f2f5` | Messages area background |
| `chat-sent` | `#d9fdd3` | Sent message bubble |
| `chat-border` | `#e9edef` | All borders (subtle, consistent) |
