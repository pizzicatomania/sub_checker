import React, { useState, useEffect } from 'react';
import { uploadFile, analyzeSubtitles, exportFile } from './api';
import type { SubtitleItem, Rule, AnalysisResult } from './api';
import { RuleManager } from './components/RuleManager';
import { SubtitleEditor } from './components/SubtitleEditor';
import { Upload, Download, Play, FileText, CheckCircle } from 'lucide-react';

function App() {
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  // Snapshot of subtitles when analysis was last run, used for the "Text" column
  const [analyzedSubtitles, setAnalyzedSubtitles] = useState<SubtitleItem[]>([]);
  const [rules, setRules] = useState<Rule[]>(() => {
    const saved = localStorage.getItem('sub_checker_rules');
    return saved ? JSON.parse(saved) : [];
  });
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem('sub_checker_rules', JSON.stringify(rules));
  }, [rules]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await uploadFile(file);
      setSubtitles(data);
      // Reset analysis state on new file
      setAnalyzedSubtitles([]);
      setAnalysisResults([]);
      setFileName(file.name);
    } catch (err) {
      alert('Failed to parse file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (subtitles.length === 0) return;
    setLoading(true);
    try {
      // Snapshot the current state of subtitles for correct highlighting mapping
      setAnalyzedSubtitles(JSON.parse(JSON.stringify(subtitles)));
      const results = await analyzeSubtitles(subtitles, rules);
      setAnalysisResults(results);
    } catch (err) {
      alert('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (subtitles.length === 0) return;
    const format = fileName.endsWith('.smi') ? 'smi' : 'srt'; // Simple deduction
    try {
      const content = await exportFile(subtitles, format);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fixed_${fileName}`;
      a.click();
    } catch (err) {
      alert('Export failed');
    }
  };

  const updateSubtitle = (index: number, newText: string) => {
    setSubtitles(prev => prev.map(item => item.index === index ? { ...item, text: newText } : item));
    // Optionally clear analysis for this item or re-run locally?
    // User requested to KEEP highlights, so we do NOT clear matches for this item.
    // setAnalysisResults(prev => prev.filter(r => r.item_index !== index));
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800 text-white p-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hover:bg-slate-700 p-1 rounded"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {/* Simple Hamburger / Panel Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-400" />
            <h1 className="text-xl font-bold">Sub Checker</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {fileName && <span className="text-sm text-gray-400 bg-slate-700 px-2 py-1 rounded">{fileName}</span>}
          <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm transition font-medium">
            <Upload size={16} />
            Import
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".srt,.smi" />
          </label>
          <button
            onClick={handleExport}
            disabled={subtitles.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition font-medium"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'} transition-all duration-300 ease-in-out border-r bg-gray-50 border-gray-200 flex flex-col shrink-0`}>
          <div className="p-4 flex flex-col h-full w-80">
            {/* Wrap content in fixed width container to prevent squash during transition */}
            <RuleManager rules={rules} onRulesChange={setRules} />
            <div className="mt-4">
              <button
                onClick={runAnalysis}
                className="w-full bg-indigo-600 text-white p-3 rounded flex items-center justify-center gap-2 font-bold shadow hover:bg-indigo-700 transition"
              >
                <Play size={18} /> Run Check
              </button>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-gray-100 p-4 overflow-hidden relative">
          {subtitles.length > 0 ? (
            <SubtitleEditor
              subtitles={subtitles}
              analyzedSubtitles={analyzedSubtitles}
              analysisResults={analysisResults}
              onUpdateSubtitle={updateSubtitle}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText size={64} className="mb-4 text-gray-300" />
              <p className="text-lg">No file loaded</p>
              <p className="text-sm">Upload an subtitle file to start editing</p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded shadow-lg flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Processing...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
