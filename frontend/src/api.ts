import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

export const getAuthToken = () => authToken;

const getAuthHeaders = () => {
    if (authToken) {
        return { Authorization: `Bearer ${authToken}` };
    }
    return {};
};

export interface SubtitleItem {
    index: number;
    start: string;
    end: string;
    text: string;
}

export interface Rule {
    id?: number;
    pattern: string;
    suggestion?: string;
}

export interface Match {
    rule_id: string;
    start_index: number;
    end_index: number;
    matched_text: string;
    suggestion?: string;
}

export interface AnalysisResult {
    item_index: number;
    matches: Match[];
}

export interface User {
    id: number;
    email: string;
    name: string;
    picture?: string;
}

// Auth API
export const googleLogin = async (token: string): Promise<User> => {
    const response = await axios.post<User>(`${API_URL}/auth/google`, { token });
    return response.data;
};

export const getMe = async (): Promise<User> => {
    const response = await axios.get<User>(`${API_URL}/auth/me`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Rules API (server-side, user-specific)
export const fetchRules = async (): Promise<Rule[]> => {
    const response = await axios.get<Rule[]>(`${API_URL}/rules`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const createRule = async (rule: { pattern: string; suggestion?: string }): Promise<Rule> => {
    const response = await axios.post<Rule>(`${API_URL}/rules`, rule, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updateRule = async (id: number, rule: { pattern: string; suggestion?: string }): Promise<Rule> => {
    const response = await axios.put<Rule>(`${API_URL}/rules/${id}`, rule, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deleteRule = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/rules/${id}`, {
        headers: getAuthHeaders()
    });
};

// File API
export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<SubtitleItem[]>(`${API_URL}/parse`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const analyzeSubtitles = async (subtitles: SubtitleItem[], rules: Rule[]) => {
    // Convert rules to backend format (needs id, case_sensitive for AnalyzeRequest)
    const backendRules = rules.map((r, i) => ({
        id: r.id?.toString() || `rule_${i}`,
        pattern: r.pattern,
        suggestion: r.suggestion || null,
        case_sensitive: false
    }));

    const response = await axios.post<{ results: AnalysisResult[] }>(`${API_URL}/analyze`, {
        subtitles,
        rules: backendRules
    });
    return response.data.results;
};

export const exportFile = async (subtitles: SubtitleItem[], format: string) => {
    const response = await axios.post<{ content: string }>(`${API_URL}/export`, {
        subtitles,
        format
    });
    return response.data.content;
};
