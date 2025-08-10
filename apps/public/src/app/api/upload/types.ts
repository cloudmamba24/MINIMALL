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
  shopId: string;
  chunks: Map<number, ChunkInfo>;
  createdAt: Date;
  status: "initiated" | "uploading" | "completed" | "failed" | "cancelled";
}

// Extend global object for upload sessions (public app)
declare global {
  var publicUploadSessions: Map<string, UploadSession> | undefined;
}
