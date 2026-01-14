import re
from typing import List
from app.models import SubtitleItem, Rule, AnalysisResult, Match

class Checker:
    def check(self, subtitles: List[SubtitleItem], rules: List[Rule]) -> List[AnalysisResult]:
        results = []
        
        for item in subtitles:
            item_matches = []
            for rule in rules:
                flags = 0 if rule.case_sensitive else re.IGNORECASE
                try:
                    for m in re.finditer(rule.pattern, item.text, flags):
                        item_matches.append(Match(
                            rule_id=rule.id,
                            start_index=m.start(),
                            end_index=m.end(),
                            matched_text=m.group(),
                            suggestion=rule.suggestion
                        ))
                except re.error:
                    # Invalid regex, skip or log (ignoring for MVP simplicity)
                    continue
            
            if item_matches:
                results.append(AnalysisResult(
                    item_index=item.index,
                    matches=item_matches
                ))
        
        return results
