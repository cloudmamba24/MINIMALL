import crypto from "node:crypto";
import { r2Service } from "@minimall/core";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";

// POST /api/upload/chunk - Upload file chunk
export async function POST(request: NextRequest) {
  try {
    if (!r2Service) {
      return NextResponse.json({ error: "R2 service not configured" }, { status: 503 });
    }

    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const uploadId = formData.get("uploadId") as string;
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string);

    if (!chunk || !uploadId || Number.isNaN(chunkIndex)) {
      return NextResponse.json(
        { error: "Missing required fields: chunk, uploadId, chunkIndex" },
        { status: 400 }
      );
    }

    // Get upload session
    globalThis.adminUploadSessions = globalThis.adminUploadSessions || new Map();
    const uploadSession = globalThis.adminUploadSessions.get(uploadId);

    if (!uploadSession) {
      return NextResponse.json({ error: "Upload session not found or expired" }, { status: 404 });
    }

    // Validate chunk index
    if (chunkIndex < 0) {
      return NextResponse.json({ error: "Invalid chunk index" }, { status: 400 });
    }

    // Convert chunk to buffer
    const buffer = Buffer.from(await chunk.arrayBuffer());

    // Generate ETag for chunk (MD5 hash)
    const etag = crypto.createHash("md5").update(buffer).digest("hex");

    // Upload chunk to R2 with chunk-specific key
    const chunkKey = `${uploadSession.key}.chunk.${chunkIndex.toString().padStart(6, "0")}`;

    await r2Service.putObject(chunkKey, buffer, {
      contentType: "application/octet-stream",
      metadata: {
        uploadId,
        chunkIndex: chunkIndex.toString(),
        etag,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Store chunk info in session
    uploadSession.chunks.set(chunkIndex, {
      etag,
      size: buffer.length,
    });

    // Update session status
    uploadSession.status = "uploading";

    Sentry.addBreadcrumb({
      category: "streaming-upload",
      message: `Uploaded chunk ${chunkIndex} for ${uploadId}`,
      data: {
        uploadId,
        chunkIndex,
        chunkSize: buffer.length,
        etag,
      },
      level: "debug",
    });

    return NextResponse.json({
      success: true,
      etag,
      chunkIndex,
      chunkSize: buffer.length,
      message: `Chunk ${chunkIndex} uploaded successfully`,
    });
  } catch (error) {
    console.error("Failed to upload chunk:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Failed to upload chunk" }, { status: 500 });
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
