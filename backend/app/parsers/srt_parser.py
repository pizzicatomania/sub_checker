from typing import List
import pysrt
from io import BytesIO
from app.parsers.base import BaseParser
from app.models import SubtitleItem
import chardet

class SRTParser(BaseParser):
    def parse(self, file_content: bytes, filename: str) -> List[SubtitleItem]:
        # Detect encoding
        result = chardet.detect(file_content)
        encoding = result['encoding'] or 'utf-8'

        try:
            content_str = file_content.decode(encoding)
        except UnicodeDecodeError:
            content_str = file_content.decode('utf-8', errors='replace')

        # Parse with pysrt
        subs = pysrt.from_string(content_str)
        
        parsed_items = []
        for sub in subs:
            parsed_items.append(SubtitleItem(
                index=sub.index,
                start=str(sub.start).replace(',', '.'), # Normalize to specific format if needed, keeping simple for now
                end=str(sub.end).replace(',', '.'),
                text=sub.text
            ))
        return parsed_items

    def export(self, subtitles: List[SubtitleItem]) -> str:
        subs = pysrt.SubRipFile()
        for item in subtitles:
            start = pysrt.SubRipTime.from_string(item.start.replace('.', ','))
            end = pysrt.SubRipTime.from_string(item.end.replace('.', ','))
            sub = pysrt.SubRipItem(index=item.index, start=start, end=end, text=item.text)
            subs.append(sub)
        
        return '\n\n'.join(str(sub) for sub in subs)
