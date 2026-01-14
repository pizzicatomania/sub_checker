from abc import ABC, abstractmethod
from typing import List, IO
from app.models import SubtitleItem

class BaseParser(ABC):
    @abstractmethod
    def parse(self, file_content: bytes, filename: str) -> List[SubtitleItem]:
        pass

    @abstractmethod
    def export(self, subtitles: List[SubtitleItem]) -> str:
        """Converts subtitles back to the file format string."""
        pass
