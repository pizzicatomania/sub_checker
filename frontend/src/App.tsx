import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { uploadFile, analyzeSubtitles, exportFile, googleLogin, fetchRules, createRule, deleteRule, setAuthToken } from './api';
import type { SubtitleItem, Rule, AnalysisResult, User } from './api';
import { RuleManager } from './components/RuleManager';
import { SubtitleEditor } from './components/SubtitleEditor';
import { Upload, Download, Play, FileText, CheckCircle, LogOut, User as UserIcon } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [analyzedSubtitles, setAnalyzedSubtitles] = useState<SubtitleItem[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load rules when user logs in
  useEffect(() => {
    if (user) {
      loadRules();
    } else {
      setRules([]);
    }
  }, [user]);

  const loadRules = async () => {
    try {
      const serverRules = await fetchRules();
      setRules(serverRules);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;

    try {
      setAuthToken(response.credential);
      const userData = await googleLogin(response.credential);
      setUser(userData);
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setRules([]);
  };

  const handleRulesChange = async (newRules: Rule[]) => {
    // Find added/removed rules
    const newIds = new Set(newRules.map(r => r.id));

    // Handle deletions
    for (const rule of rules) {
      if (rule.id && !newIds.has(rule.id)) {
        try {
          await deleteRule(rule.id);
        } catch (err) {
          console.error('Failed to delete rule:', err);
        }
      }
    }

    // Handle additions (rules without id)
    for (const rule of newRules) {
      if (!rule.id) {
        try {
          const created = await createRule({ pattern: rule.pattern, suggestion: rule.suggestion });
          rule.id = created.id;
        } catch (err) {
          console.error('Failed to create rule:', err);
        }
      }
    }

    setRules(newRules.filter(r => r.id));
    loadRules(); // Refresh from server
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await uploadFile(file);
      setSubtitles(data);
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
    const format = fileName.endsWith('.smi') ? 'smi' : (fileName.endsWith('.txt') ? 'txt' : 'srt');
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
  };

  // If not logged in, show login screen
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Sub Checker</h1>
            <p className="text-gray-500">Sign in to manage your subtitle rules</p>
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert('Login failed')}
              theme="outline"
              size="large"
            />
          </div>
        </div>
      </div>
    );
  }

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
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".srt,.smi,.txt" />
          </label>
          <button
            onClick={handleExport}
            disabled={subtitles.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition font-medium"
          >
            <Download size={16} />
            Export
          </button>
          {/* User info */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-600">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <UserIcon size={20} />
            )}
            <span className="text-sm">{user.name}</span>
            <button
              onClick={handleLogout}
              className="ml-2 p-1 hover:bg-slate-700 rounded"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'} transition-all duration-300 ease-in-out border-r bg-gray-50 border-gray-200 flex flex-col shrink-0`}>
          <div className="p-4 flex flex-col h-full w-80">
            <RuleManager rules={rules} onRulesChange={handleRulesChange} />
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
              <p className="text-sm">Upload a subtitle file to start editing</p>
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
