import React from 'react';
import type { SubtitleItem, AnalysisResult, Match } from '../api';
import clsx from 'clsx';

interface Props {
    subtitles: SubtitleItem[];
    analyzedSubtitles?: SubtitleItem[];
    analysisResults: AnalysisResult[];
    onUpdateSubtitle: (index: number, text: string) => void;
}

export const SubtitleEditor: React.FC<Props> = ({ subtitles, analyzedSubtitles, analysisResults, onUpdateSubtitle }) => {

    // Create a map for quick lookup of results by index
    const resultsMap = new Map(analysisResults.map(r => [r.item_index, r]));

    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
    const [editText, setEditText] = React.useState('');

    const startEditing = (index: number, text: string) => {
        setEditingIndex(index);
        setEditText(text);
    };

    const saveEdit = (index: number) => {
        onUpdateSubtitle(index, editText);
        setEditingIndex(null);
    };

    const handleAccept = (index: number, currentText: string, matches: Match[]) => {
        let newText = currentText;
        // Sort matches descending to avoid index shift issues during replacement?
        // Actually, simple string replacement by ranges is easiest if processed end-to-start
        const sortedMatches = [...matches].sort((a, b) => b.start_index - a.start_index);

        for (const match of sortedMatches) {
            if (match.suggestion) {
                // Verify the text at this range still matches what we think (sanity check)
                // Note: 'analyzedSubtitles' has the text at analysis time. 
                // However, we apply to 'newText' which starts as 'analyzed' text for a clean apply.
                // Wait, we want to apply to the 'Edited' text? Or just overwrite 'Edited' text with 'Analyzed + Corrections'?
                // Requirement: "button click all suggestions reflected in edited column".
                // It's safest to take the text that was *analyzed* and apply patches, then set that as the new Edited text.
                // If the user made manual edits *before* clicking Accept, those might be lost if we use analyzed text.
                // But since 'Accept' is driven by the analysis of *that* text, mixing manual edits + old analysis is risky.
                // Let's assume Accept overwrites manual edits with (AnalyzedText + Suggestions).
                const prefix = newText.slice(0, match.start_index);
                const suffix = newText.slice(match.end_index);
                newText = prefix + match.suggestion + suffix;
            }
        }
        onUpdateSubtitle(index, newText);
    };

    const renderHighlightedText = (text: string, matches: Match[]) => {
        if (!matches || matches.length === 0) return text;

        // Sort matches by start index
        const sortedMatches = [...matches].sort((a, b) => a.start_index - b.start_index);

        let lastIndex = 0;
        const parts = [];

        for (const match of sortedMatches) {
            if (match.start_index < lastIndex) continue; // Skip overlaps for now

            // Text before match
            if (match.start_index > lastIndex) {
                parts.push(text.slice(lastIndex, match.start_index));
            }

            // Matched text
            parts.push(
                <span
                    key={`${match.start_index}-${match.end_index}`}
                    className="bg-yellow-200 text-red-700 border-b-2 border-red-400 cursor-help relative group font-semibold"
                >
                    {text.slice(match.start_index, match.end_index)}
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max px-2 py-1 bg-gray-800 text-white text-xs rounded shadow z-50">
                        {match.suggestion ? `Suggested: ${match.suggestion}` : 'No suggestion'}
                    </span>
                </span>
            );
            lastIndex = match.end_index;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts;
    };

    return (
        <div className="bg-white shadow rounded overflow-auto h-full">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="p-2 border-b w-12 text-center text-gray-600 font-semibold">#</th>
                        <th className="p-2 border-b w-24 text-gray-600 font-semibold">Start</th>
                        <th className="p-2 border-b w-24 text-gray-600 font-semibold">End</th>
                        <th className="p-2 border-b w-1/3 text-gray-600 font-semibold">Text (Analyzed)</th>
                        <th className="p-2 border-b w-24 text-center text-gray-600 font-semibold">Accept</th>
                        <th className="p-2 border-b text-gray-600 font-semibold">Edited</th>
                    </tr>
                </thead>
                <tbody>
                    {subtitles.map((item, i) => {
                        // Use analyzed item for the "Text" column if available, else current item
                        // Fix: Check if analyzedSubtitles has an item at this index
                        const analyzedItem = (analyzedSubtitles && analyzedSubtitles[i]) ? analyzedSubtitles[i] : item;
                        const result = resultsMap.get(item.index);
                        const hasMatches = result && result.matches.length > 0;
                        const hasSuggestions = result?.matches.some(m => !!m.suggestion);
                        const isEditing = editingIndex === item.index;

                        return (
                            <tr key={item.index} className={clsx("hover:bg-gray-50 transition-colors", hasMatches && "bg-orange-50")}>
                                <td className="p-2 border-b text-center text-gray-500">{item.index}</td>
                                <td className="p-2 border-b px-2 font-mono text-sm text-gray-600 whitespace-nowrap">{item.start}</td>
                                <td className="p-2 border-b px-2 font-mono text-sm text-gray-600 whitespace-nowrap">{item.end}</td>

                                {/* Analyzed Text Column */}
                                <td className="p-2 border-b relative">
                                    <div className="whitespace-pre-wrap">
                                        {/* Always show highlighting based on analysis results for the *analyzed* text */}
                                        {renderHighlightedText(analyzedItem.text, result?.matches || [])}
                                    </div>
                                </td>

                                {/* Accept Button Column */}
                                <td className="p-2 border-b text-center align-middle">
                                    {hasMatches && hasSuggestions && (
                                        <button
                                            onClick={() => handleAccept(item.index, analyzedItem.text, result!.matches)}
                                            className="bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 px-3 py-1 rounded text-xs font-bold transition-colors"
                                            title="Apply all suggestions"
                                        >
                                            Accept
                                        </button>
                                    )}
                                </td>

                                {/* Edited Column (Editable) */}
                                <td
                                    className="p-2 border-b cursor-text relative"
                                    onClick={() => !isEditing && startEditing(item.index, item.text)}
                                >
                                    {isEditing ? (
                                        <textarea
                                            className="w-full min-h-[1.5em] p-1 border border-blue-400 rounded outline-none focus:ring-2 focus:ring-blue-200 resize-y bg-white text-gray-900"
                                            value={editText}
                                            autoFocus
                                            onChange={(e) => setEditText(e.target.value)}
                                            onBlur={() => saveEdit(item.index)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    saveEdit(item.index);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="min-h-[1.5em] whitespace-pre-wrap text-gray-800">
                                            {item.text}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
