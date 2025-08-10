import { r2Service } from "@minimall/core";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import type { UploadSession } from "../types";

interface InitiateUploadRequest {
  filename: string;
  size: number;
  type: string;
  uploadId: string;
}

// POST /api/upload/initiate - Start multipart upload
export async function POST(request: NextRequest) {
  try {
    if (!r2Service) {
      return NextResponse.json({ error: "R2 service not configured" }, { status: 503 });
    }

    const body: InitiateUploadRequest = await request.json();
    const { filename, size, type, uploadId } = body;

    if (!filename || !size || !type || !uploadId) {
      return NextResponse.json(
        { error: "Missing required fields: filename, size, type, uploadId" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: `File type ${type} not allowed` }, { status: 400 });
    }

    // Validate file size (100MB limit for streaming uploads)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 100MB limit" }, { status: 400 });
    }

    // Generate unique key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = filename.split(".").pop() || "";
    const _fileName = `${timestamp}-${random}.${extension}`;
    const key = `uploads/streaming/${_fileName}`;

    // Store upload metadata (in production, use Redis or database)
    const uploadMetadata: UploadSession = {
      uploadId,
      key,
      filename,
      size,
      type,
      chunks: new Map(),
      createdAt: new Date(),
      status: "initiated",
    };

    // In production, store this in Redis or database
    // For now, we'll use a simple in-memory store with cleanup
    globalThis.uploadSessions = globalThis.uploadSessions || new Map();
    globalThis.uploadSessions.set(uploadId, uploadMetadata);

    // Cleanup old sessions (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, session] of globalThis.uploadSessions.entries()) {
      if (session.createdAt.getTime() < oneHourAgo) {
        globalThis.uploadSessions.delete(id);
      }
    }

    Sentry.addBreadcrumb({
      category: "streaming-upload",
      message: `Initiated streaming upload: ${filename}`,
      data: { uploadId, size, type },
      level: "info",
    });

    return NextResponse.json({
      success: true,
      uploadId,
      key,
      message: "Streaming upload initiated",
    });
  } catch (error) {
    console.error("Failed to initiate streaming upload:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Failed to initiate upload" }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
