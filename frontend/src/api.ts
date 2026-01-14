import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface SubtitleItem {
    index: number;
    start: string;
    end: string;
    text: string;
}

export interface Rule {
    id: string;
    pattern: string;
    suggestion?: string;
    description?: string;
    case_sensitive: boolean;
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

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<SubtitleItem[]>(`${API_URL}/parse`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const analyzeSubtitles = async (subtitles: SubtitleItem[], rules: Rule[]) => {
    const response = await axios.post<{ results: AnalysisResult[] }>(`${API_URL}/analyze`, {
        subtitles,
        rules
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
