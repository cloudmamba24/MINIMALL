import { getR2Service } from "@minimall/core/server";
import { type NextRequest, NextResponse } from "next/server";
import type { UploadSession } from "../types";

interface InitiateUploadRequest {
  filename: string;
  size: number;
  type: string;
  uploadId: string;
  shopId?: string;
}

// POST /api/upload/initiate - Start multipart upload
export async function POST(request: NextRequest) {
  try {
    const body: InitiateUploadRequest = await request.json();
    const { filename, size, type, uploadId, shopId = "demo" } = body;

    if (!filename || !size || !type || !uploadId) {
      return NextResponse.json(
        { error: "Missing required fields: filename, size, type, uploadId" },
        { status: 400 }
      );
    }

    // Validate file type (public app - images only)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: `File type ${type} not allowed. Only JPEG, PNG, WebP, and GIF are supported.` },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit for public streaming uploads)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    try {
      const _r2Service = getR2Service();

      // Generate unique key with shop organization
      const timestamp = Date.now();
      const _extension = filename.split(".").pop() || "";
      const fileName = `${timestamp}-${filename}`;
      const key = `uploads/${shopId}/streaming/${fileName}`;

      // Store upload metadata (in production, use Redis or database)
      const uploadMetadata: UploadSession = {
        uploadId,
        key,
        filename,
        size,
        type,
        shopId,
        chunks: new Map<number, { etag: string; size: number }>(),
        createdAt: new Date(),
        status: "initiated",
      };

      // In production, store this in Redis or database
      globalThis.uploadSessions = globalThis.uploadSessions || new Map();
      globalThis.uploadSessions.set(uploadId, uploadMetadata);

      // Cleanup old sessions (older than 1 hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      for (const [id, session] of globalThis.uploadSessions.entries()) {
        if (session.createdAt.getTime() < oneHourAgo) {
          globalThis.uploadSessions.delete(id);
        }
      }

      return NextResponse.json({
        success: true,
        uploadId,
        key,
        message: "Streaming upload initiated",
      });
    } catch (r2Error) {
      console.error("R2 service not available for streaming upload:", r2Error);

      // Fallback: reject streaming upload if R2 not configured
      return NextResponse.json(
        { error: "Streaming upload requires R2 configuration. Use simple upload instead." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Failed to initiate streaming upload:", error);

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
