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
  status: "initiated" | "uploading" | "completed" | "failed" | "cancelled";
}

// Extend global object for upload sessions (admin app)
declare global {
  var adminUploadSessions: Map<string, UploadSession> | undefined;
}
