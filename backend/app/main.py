from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from app.models import SubtitleItem, Rule, AnalyzeResponse, AnalyzeRequest
from app.parsers.srt_parser import SRTParser
from app.parsers.netflix_parser import NetflixTextParser
from app.checker import Checker
import io

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registry of parsers
PARSERS = {
    'srt': SRTParser(),
    'txt': NetflixTextParser()
}

@app.post("/api/parse", response_model=List[SubtitleItem])
async def parse_file(file: UploadFile = File(...)):
    extension = file.filename.split('.')[-1].lower()
    if extension not in PARSERS:
         # Fallback default or error? For MVP, error if not supported.
         # Ideally we might try to auto-detect content.
         if extension == 'txt':
             # Treat as custom or plain text? 
             # For now, just throwing error unless it's srt
             pass
    
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
