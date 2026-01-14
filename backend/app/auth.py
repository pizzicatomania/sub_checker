from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
from .database import get_db, User

GOOGLE_CLIENT_ID = None  # Will be set from environment

def set_google_client_id(client_id: str):
    global GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_ID = client_id

def verify_google_token(token: str) -> dict:
    """Verify Google ID token and return user info."""
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Invalid issuer')
        
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', '')
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    
    try:
        user_info = verify_google_token(token)
        user = db.query(User).filter(User.google_id == user_info['google_id']).first()
        return user
    except:
        return None

def require_auth(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Require authenticated user."""
    user = get_current_user(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
