/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Paper, Message, Citation, Report } from '../types';

// Read API Base URL from Vite environment, fallback to relative path in production or localhost in dev
const getApiBaseUrl = (): string => {
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  // If running in production (e.g. Docker, Hugging Face), use the host origin
  if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

let token = localStorage.getItem('insightai_token') || '';

export function setToken(newToken: string) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('insightai_token', newToken);
  } else {
    localStorage.removeItem('insightai_token');
  }
}

export function getToken(): string {
  return token;
}

function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
  user: UserResponse;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: UserResponse;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  paper_id: string;
  filename: string;
  status: string;
}

export interface SummarizeResponse {
  success: boolean;
  paper_id: string;
  summary: {
    id: number;
    paper_id: string;
    summary: string;
    created_at: string;
  };
}

export interface ExtractCitationsResponse {
  success: boolean;
  paper_id: string;
  total_citations: number;
  citations: {
    id: number;
    paper_id: string;
    author?: string;
    year?: string;
    title?: string;
    raw_text?: string;
  }[];
}

export interface ChatResponse {
  paper_id: string;
  question: string;
  answer: string;
  sources: string[];
}

export interface ChatHistoryResponse {
  paper_id: string;
  total: number;
  history: {
    question: string;
    answer: string;
    created_at: string;
  }[];
}

export interface GenerateReportResponse {
  success: boolean;
  message: string;
  paper_id: string;
  report_id: number;
  format: string;
  download_url: string;
}

export interface DashboardResponse {
  success: boolean;
  data: {
    total_papers: number;
    ready_papers: number;
    processing_papers: number;
    total_reports: number;
    total_qa_interactions: number;
    recent_papers: {
      paper_id: string;
      title: string;
      status: string;
      upload_date: string;
    }[];
  };
}

export interface AdminStatsResponse {
  success: boolean;
  data: {
    total_users: number;
    total_papers: number;
    total_reports: number;
    total_qa_interactions: number;
    papers_by_status: { [status: string]: number };
    new_users_this_week: number;
  };
}

// ── Auth Endpoints ───────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Login failed. (Status: ${response.status})`);
  }
  const data: LoginResponse = await response.json();
  if (data.token?.access_token) {
    setToken(data.token.access_token);
  }
  return data;
}

export async function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Registration failed. (Status: ${response.status})`);
  }
  return response.json();
}

export async function getProfile(): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile. (Status: ${response.status})`);
  }
  return response.json();
}

export async function updateProfile(name: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Profile update failed. (Status: ${response.status})`);
  }
  return response.json();
}

export async function changePassword(current_password: string, new_password: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: 'PUT',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ current_password, new_password }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Password change failed. (Status: ${response.status})`);
  }
  return response.json();
}

// ── Research Papers Endpoints ───────────────────────────────────────────────────

export async function getPapers(page = 1, pageSize = 100, search = ''): Promise<{ papers: Paper[]; total: number }> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) {
    params.append('search', search);
  }
  const response = await fetch(`${API_BASE_URL}/api/papers?${params.toString()}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch academic repository papers. (Status: ${response.status})`);
  }
  const data = await response.json();
  // Map backend paper schema to frontend Paper shape
  const papers: Paper[] = data.papers.map((p: any) => ({
    id: p.paper_id,
    title: p.title || p.filename,
    type: p.filename.split('.').pop()?.toUpperCase() as any || 'PDF',
    uploadedAt: new Date(p.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: p.status === 'ready' ? 'analyzed' : 'pending', // map backend 'ready' status to frontend 'analyzed'
    authors: p.authors || 'Unknown Authors',
    journal: 'Academic Publication',
    abstract: p.abstract || '',
    contributions: [],
    metrics: { gpus: 'Unified Acceleration', time: 'Processed', score: 'Complete' },
    progress: p.status === 'ready' ? 100 : (p.status === 'processing' ? 60 : 25),
    citations: [],
    figures: [],
    qna: [],
    report: {
      title: 'Synthesis Report',
      executiveSummary: '',
      futureScope: [],
      sourcesCount: 0,
      confidence: '95%',
      wordCount: '0 words',
      collaborators: [],
      previewUrl: ''
    }
  }));
  return { papers, total: data.total };
}

export async function getPaperById(id: string): Promise<Paper> {
  const response = await fetch(`${API_BASE_URL}/api/papers/${id}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch academic manuscript by ID: ${id}. (Status: ${response.status})`);
  }
  const p = await response.json();
  return {
    id: p.paper_id,
    title: p.title || p.filename,
    type: p.filename.split('.').pop()?.toUpperCase() as any || 'PDF',
    uploadedAt: new Date(p.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: p.status === 'ready' ? 'analyzed' : 'pending',
    authors: p.authors || 'Unknown Authors',
    journal: 'Academic Publication',
    abstract: p.abstract || '',
    contributions: [],
    metrics: { gpus: 'Unified Acceleration', time: 'Processed', score: 'Complete' },
    progress: p.status === 'ready' ? 100 : (p.status === 'processing' ? 60 : 25),
    citations: [],
    figures: [],
    qna: [],
    report: {
      title: 'Synthesis Report',
      executiveSummary: '',
      futureScope: [],
      sourcesCount: 0,
      confidence: '95%',
      wordCount: '0 words',
      collaborators: [],
      previewUrl: ''
    }
  };
}

export async function uploadPaper(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/papers/upload`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to upload academic manuscript file. (Status: ${response.status})`);
  }
  return response.json();
}

export async function reprocessPaper(paperId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/papers/${paperId}/reprocess`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to trigger paper reprocessing. (Status: ${response.status})`);
  }
  return response.json();
}

export async function summarizePaper(paperId: string): Promise<SummarizeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/papers/${paperId}/summary`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate academic layout summary. (Status: ${response.status})`);
  }
  return response.json();
}

export async function extractCitations(paperId: string): Promise<ExtractCitationsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/papers/${paperId}/citations`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract manuscript bibliography records. (Status: ${response.status})`);
  }
  return response.json();
}

// ── Chat / RAG Endpoints ───────────────────────────────────────────────────────

export async function askPaperQuery(paperId: string, question: string, history: { role: 'user' | 'model'; text: string }[] = []): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ paper_id: paperId, question, history }),
  });

  if (!response.ok) {
    throw new Error(`Failed to process technical query. (Status: ${response.status})`);
  }
  return response.json();
}

export async function getChatHistory(paperId: string): Promise<ChatHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/${paperId}/history`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch chat history. (Status: ${response.status})`);
  }
  return response.json();
}

// ── Reports & Dashboard Endpoints ───────────────────────────────────────────────────

export async function generateReport(paperId: string, format: 'pdf' | 'docx' = 'pdf'): Promise<GenerateReportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/papers/${paperId}/report`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ format }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate formal executive synthesis report. (Status: ${response.status})`);
  }
  return response.json();
}

export async function downloadReport(reportId: number, filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/download`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to download report file. (Status: ${response.status})`);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function getReports(): Promise<{ total: number; reports: { id: number; paper_id: string; format: string; created_at: string }[] }> {
  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch reports. (Status: ${response.status})`);
  }
  return response.json();
}

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard metrics. (Status: ${response.status})`);
  }
  return response.json();
}

// ── Admin Endpoints ───────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to fetch admin stats. (Status: ${response.status})`);
  }
  return response.json();
}
