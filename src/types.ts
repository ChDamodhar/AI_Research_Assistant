/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FileType = 'PDF' | 'DOCX' | 'TEX';

export interface Citation {
  id: string;
  author: string;
  year: number;
  title: string;
  link: string;
}

export interface Figure {
  title: string;
  url: string;
  caption: string;
}

export interface Message {
  id: string;
  sender: 'ai' | 'user';
  timestamp: string;
  text: string;
  citations?: string[]; // reference labels like "[1] Vaswani et al. (2017)"
}

export interface Report {
  title: string;
  executiveSummary: string;
  futureScope: string[];
  sourcesCount: number;
  confidence: string;
  wordCount: string;
  collaborators: { name: string; initials: string; color: string }[];
  previewUrl: string;
}

export interface Paper {
  id: string;
  title: string;
  type: FileType;
  uploadedAt: string;
  status: 'analyzed' | 'pending';
  authors: string;
  journal: string;
  abstract: string;
  contributions: string[];
  metrics: {
    gpus: string;
    time: string;
    score: string;
  };
  progress: number;
  citations: Citation[];
  figures: Figure[];
  qna: Message[];
  report: Report;
}

export interface UserProfileType {
  fullName: string;
  email: string;
  role: string;
  version: string;
  lastChangedPasswordText: string;
}

export type ViewScreen = 
  | 'LOGIN'
  | 'REGISTER'
  | 'DASHBOARD'
  | 'MY_PAPERS'
  | 'PAPER_DETAILS'
  | 'USER_PROFILE'
  | 'ADMIN_DASHBOARD';

export type DetailTab = 'SUMMARY' | 'CITATIONS' | 'QNA' | 'REPORT';

export interface Activity {
  id: string;
  title: string;
  type: 'upload' | 'analysis' | 'report' | 'qna';
  timestamp: string;
  paperId?: string;
}
