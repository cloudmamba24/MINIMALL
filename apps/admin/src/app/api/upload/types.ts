// Type definitions for streaming upload sessions

export interface ChunkInfo {
  etag: string;
  size: number;
}

export interface UploadSession {
  uploadId: string;
  key: string;
  filename: string;
  size: number;
  type: string;
  chunks: Map<number, ChunkInfo>;
  createdAt: Date;
  status: 'initiated' | 'uploading' | 'completed' | 'failed' | 'cancelled';
}

// Extend global object for upload sessions
declare global {
  var uploadSessions: Map<string, UploadSession> | undefined;
}

export {};