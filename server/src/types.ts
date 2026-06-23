import type { Request } from 'express';

export interface Note {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title?: string;
  content?: string;
}

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Extend Express Request to include authenticated user ID
export interface AuthRequest extends Request {
  userId?: number;
}
