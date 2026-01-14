import re
from typing import List
from ..models import SubtitleItem
from .base import BaseParser

class NetflixTextParser(BaseParser):
    def parse(self, content: bytes, filename: str = "") -> List[SubtitleItem]:
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text = content.decode('cp949') # Fallback for Korean Windows
            except:
                text = content.decode('latin-1')

        lines = text.replace('\r\n', '\n').split('\n')
        subtitles = []
        
        current_index = None
        current_text_lines = []
        
        # Regex to identify a line that is JUST a number (index)
        index_pattern = re.compile(r'^\d+$')

        for i, line in enumerate(lines):
            stripped = line.strip()
            
            if not stripped:
                # Empty line - could be separator. 
                # If we have collected text, verify if we are ending a block
                continue

            # Check if likely an index
            # An index line should be a number, and usually followed by text or another number (if gap)
            # But the format is: Index \n Text \n\n Index...
            if index_pattern.match(stripped):
                # If we have a previous block accumulating, finalize it
                if current_index is not None and current_text_lines:
                    subtitles.append(SubtitleItem(
                        index=current_index,
                        start="00:00:00,000", # Dummy
                        end="00:00:00,000",   # Dummy
                        text='\n'.join(current_text_lines)
                    ))
                    current_text_lines = []

                # Start new block
                current_index = int(stripped)
            else:
                # Content line
                if current_index is not None:
                    current_text_lines.append(stripped)

        # Finalize last block
        if current_index is not None and current_text_lines:
             subtitles.append(SubtitleItem(
                index=current_index,
                start="00:00:00,000",
                end="00:00:00,000",
                text='\n'.join(current_text_lines)
            ))

        return subtitles

    def export(self, subtitles: List[SubtitleItem]) -> str:
        # Reconstruct: Index \n Text \n\n
        output = []
        for sub in subtitles:
            output.append(str(sub.index))
            output.append(sub.text)
            output.append('') # Blank line for separator
        
        return '\n'.join(output)
