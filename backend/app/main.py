from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

load_dotenv()

from app.models import SubtitleItem, Rule, AnalyzeResponse, AnalyzeRequest
from app.parsers.srt_parser import SRTParser
from app.parsers.netflix_parser import NetflixTextParser
from app.checker import Checker
from app.database import get_db, init_db, User, UserRule
from app.auth import verify_google_token, get_current_user, require_auth, set_google_client_id

app = FastAPI()

# Google OAuth Client ID
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
if GOOGLE_CLIENT_ID:
    set_google_client_id(GOOGLE_CLIENT_ID)

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Registry of parsers
PARSERS = {
    'srt': SRTParser(),
    'txt': NetflixTextParser()
}

# === Auth Endpoints ===

class GoogleLoginRequest(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    picture: Optional[str]

    class Config:
        from_attributes = True

@app.post("/api/auth/google", response_model=UserResponse)
async def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Login with Google ID token."""
    user_info = verify_google_token(request.token)
    
    # Find or create user
    user = db.query(User).filter(User.google_id == user_info['google_id']).first()
    if not user:
        user = User(
            google_id=user_info['google_id'],
            email=user_info['email'],
            name=user_info['name'],
            picture=user_info['picture']
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user info
        user.name = user_info['name']
        user.picture = user_info['picture']
        db.commit()
    
    return user

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(user: User = Depends(require_auth)):
    """Get current user info."""
    return user

# === Rules Endpoints (User-specific) ===

class RuleCreate(BaseModel):
    pattern: str
    suggestion: Optional[str] = None

class RuleResponse(BaseModel):
    id: int
    pattern: str
    suggestion: Optional[str]
    
    class Config:
        from_attributes = True

@app.get("/api/rules", response_model=List[RuleResponse])
async def get_rules(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    """Get all rules for current user."""
    rules = db.query(UserRule).filter(UserRule.user_id == user.id).all()
    return rules

@app.post("/api/rules", response_model=RuleResponse)
async def create_rule(rule: RuleCreate, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    """Create a new rule for current user."""
    db_rule = UserRule(
        user_id=user.id,
        pattern=rule.pattern,
        suggestion=rule.suggestion
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@app.put("/api/rules/{rule_id}", response_model=RuleResponse)
async def update_rule(rule_id: int, rule: RuleCreate, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    """Update a rule."""
    db_rule = db.query(UserRule).filter(UserRule.id == rule_id, UserRule.user_id == user.id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db_rule.pattern = rule.pattern
    db_rule.suggestion = rule.suggestion
    db.commit()
    db.refresh(db_rule)
    return db_rule

@app.delete("/api/rules/{rule_id}")
async def delete_rule(rule_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    """Delete a rule."""
    db_rule = db.query(UserRule).filter(UserRule.id == rule_id, UserRule.user_id == user.id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(db_rule)
    db.commit()
    return {"ok": True}

# === Existing Endpoints ===

@app.post("/api/parse", response_model=List[SubtitleItem])
async def parse_file(file: UploadFile = File(...)):
    extension = file.filename.split('.')[-1].lower()
    
    parser = PARSERS.get(extension)
    if not parser:
        raise HTTPException(status_code=400, detail=f"Unsupported file extension: {extension}")
    
    content = await file.read()
    return parser.parse(content, file.filename)

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_subtitles(request: AnalyzeRequest):
    checker = Checker()
    results = checker.check(request.subtitles, request.rules)
    return AnalyzeResponse(results=results)

@app.post("/api/export")
async def export_file(subtitles: List[SubtitleItem] = Body(...), format: str = Body(..., embed=True)):
    parser = PARSERS.get(format)
    if not parser:
        raise HTTPException(status_code=400, detail=f"Unsupported export format: {format}")
    
    content = parser.export(subtitles)
    return {"content": content}

@app.get("/health")
def health_check():
    return {"status": "ok"}
