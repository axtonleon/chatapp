from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.config import FRONTEND_URL, DATABASE_MODE
from app.routes import auth, users, chats, messages, ai
from app.websocket import router as ws_router

app = FastAPI(title="ChatApp API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(chats.router, prefix="/api/chats", tags=["chats"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(ws_router)


@app.on_event("startup")
def on_startup():
    if DATABASE_MODE == "sqlite":
        from app.database.session import init_db
        init_db()
        print("SQLite database initialized")
    else:
        print("Using Supabase database")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "database": DATABASE_MODE}
