from pydantic import BaseModel
from typing import List, Optional

class SubtitleItem(BaseModel):
    index: int
    start: Optional[str] = None # Timecode string (e.g., 00:00:01,000)
    end: Optional[str] = None
    text: str

class Rule(BaseModel):
    id: str
    pattern: str          # Regex pattern
    suggestion: Optional[str] = None
    description: Optional[str] = None
    case_sensitive: bool = False

class Match(BaseModel):
    rule_id: str
    start_index: int      # Char index in the text
    end_index: int
    matched_text: str
    suggestion: Optional[str] = None

class AnalysisResult(BaseModel):
    item_index: int       # Reference to SubtitleItem.index
    matches: List[Match]

class AnalyzeRequest(BaseModel):
    subtitles: List[SubtitleItem]
    rules: List[Rule]

class AnalyzeResponse(BaseModel):
    results: List[AnalysisResult]
