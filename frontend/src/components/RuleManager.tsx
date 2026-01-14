import React, { useState } from 'react';
import type { Rule } from '../api';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
    rules: Rule[];
    onRulesChange: (rules: Rule[]) => void;
}

export const RuleManager: React.FC<Props> = ({ rules, onRulesChange }) => {
    const [newPattern, setNewPattern] = useState('');
    const [newSuggestion, setNewSuggestion] = useState('');

    const addRule = () => {
        if (!newPattern.trim()) return;
        const rule: Rule = {
            pattern: newPattern,
            suggestion: newSuggestion || undefined
        };
        onRulesChange([...rules, rule]);
        setNewPattern('');
        setNewSuggestion('');
    };

    const handleDeleteRule = (id: number | undefined) => {
        if (id === undefined) return;
        onRulesChange(rules.filter(r => r.id !== id));
    };

    return (
        <div className="bg-white p-4 rounded shadow h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4">Check Rules</h2>

            <div className="mb-4 space-y-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Regex Pattern</label>
                    <input
                        type="text"
                        className="w-full border p-2 rounded"
                        placeholder="e.g. teh"
                        value={newPattern}
                        onChange={e => setNewPattern(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Suggestion</label>
                    <input
                        type="text"
                        className="w-full border p-2 rounded"
                        placeholder="e.g. the"
                        value={newSuggestion}
                        onChange={e => setNewSuggestion(e.target.value)}
                    />
                </div>
                <button
                    onClick={addRule}
                    className="w-full bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={16} /> Add Rule
                </button>
            </div>

            <div className="flex-1 overflow-auto space-y-2">
                {rules.map(rule => (
                    <div key={rule.id} className="border p-2 rounded flex justify-between items-start bg-gray-50">
                        <div>
                            <div className="font-mono text-sm text-blue-800">/{rule.pattern}/</div>
                            {rule.suggestion && (
                                <div className="text-sm text-green-700">→ {rule.suggestion}</div>
                            )}
                        </div>
                        <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-gray-400 hover:text-red-500"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
