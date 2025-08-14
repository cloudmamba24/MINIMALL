import { getR2Service } from "@minimall/core";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";

interface CompleteUploadRequest {
  uploadId: string;
  chunks: Array<{
    index: number;
    etag: string;
  }>;
}

// POST /api/upload/complete - Complete multipart upload
export async function POST(request: NextRequest) {
  try {
    const r2Service = getR2Service();
    if (!r2Service) {
      return NextResponse.json({ error: "R2 service not configured" }, { status: 503 });
    }

    const body: CompleteUploadRequest = await request.json();
    const { uploadId, chunks } = body;

    if (!uploadId || !chunks || !Array.isArray(chunks)) {
      return NextResponse.json(
        { error: "Missing required fields: uploadId, chunks" },
        { status: 400 }
      );
    }

    // Get upload session
    globalThis.adminUploadSessions = globalThis.adminUploadSessions || new Map();
    const uploadSession = globalThis.adminUploadSessions.get(uploadId);

    if (!uploadSession) {
      return NextResponse.json({ error: "Upload session not found or expired" }, { status: 404 });
    }

    try {
      // Sort chunks by index to ensure correct order
      const sortedChunks = chunks
        .sort((a, b) => a.index - b.index)
        .filter((chunk) => uploadSession.chunks.has(chunk.index));

      // Verify all chunks are present
      const expectedChunkCount = Math.max(...chunks.map((c) => c.index)) + 1;
      if (sortedChunks.length !== expectedChunkCount) {
        return NextResponse.json(
          { error: `Missing chunks. Expected ${expectedChunkCount}, got ${sortedChunks.length}` },
          { status: 400 }
        );
      }

      // Read and combine all chunks in order
      const chunkBuffers: Buffer[] = [];
      let _totalSize = 0;

      for (const chunkInfo of sortedChunks) {
        const chunkKey = `${uploadSession.key}.chunk.${chunkInfo.index.toString().padStart(6, "0")}`;

        try {
          // Get chunk from R2
          const chunkData = await r2Service.getObject(chunkKey);
          const chunkBuffer = Buffer.from(chunkData, "base64");
          chunkBuffers.push(chunkBuffer);
          _totalSize += chunkBuffer.length;
        } catch (_chunkError) {
          console.error(`Failed to retrieve chunk ${chunkInfo.index}:", chunkError);
          throw new Error("Failed to retrieve chunk ${chunkInfo.index}`);
        }
      }

      // Combine all chunks into final file
      const finalBuffer = Buffer.concat(chunkBuffers);

      // Upload complete file to final location
      await r2Service.putObject(uploadSession.key, finalBuffer, {
        contentType: uploadSession.type,
        // Note: R2ConfigService doesn't support metadata in putObject
        // metadata would go here: { originalName, uploadedAt, size, mimeType, uploadType, chunkCount }
      });

      // Clean up chunk files
      const cleanupPromises = sortedChunks.map(async (chunkInfo) => {
        const chunkKey = `${uploadSession.key}.chunk.${chunkInfo.index.toString().padStart(6, "0")}`;
        try {
          await r2Service.deleteObject(chunkKey);
        } catch (error) {
          console.warn(`Failed to delete chunk ${chunkKey}:`, error);
        }
      });

      // Don't wait for cleanup to complete
      Promise.all(cleanupPromises).catch((error) => {
        console.warn("Chunk cleanup failed:", error);
      });

      // Get the final URL
      const url = r2Service.getObjectUrl(uploadSession.key);

      // Create asset record
      const asset = {
        id: uploadSession.key,
        name: uploadSession.filename.replace(/\.[^/.]+$/, ""), // Remove extension
        originalName: uploadSession.filename,
        type: getAssetType(uploadSession.type),
        mimeType: uploadSession.type,
        size: finalBuffer.length,
        url,
        folder: "uploads/streaming",
        uploadedAt: new Date(),
        uploadType: "streaming",
      };

      // Mark session as completed and remove it
      uploadSession.status = "completed";
      globalThis.adminUploadSessions.delete(uploadId);

      Sentry.addBreadcrumb({
        category: "streaming-upload",
        message: `Completed streaming upload: ${uploadSession.filename}`,
        data: {
          uploadId,
          finalSize: finalBuffer.length,
          chunkCount: sortedChunks.length,
          filename: uploadSession.filename,
        },
        level: "info",
      });

      return NextResponse.json({
        success: true,
        asset,
        url,
        key: uploadSession.key,
        size: finalBuffer.length,
        type: uploadSession.type,
        uploadType: "streaming",
        message: "Streaming upload completed successfully",
      });
    } catch (assemblyError) {
      console.error("Failed to assemble chunks:", assemblyError);

      // Mark session as failed but don't delete (for debugging)
      uploadSession.status = "failed";

      return NextResponse.json({ error: "Failed to assemble file chunks" }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to complete streaming upload:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Failed to complete upload" }, { status: 500 });
  }
}

function getAssetType(mimeType: string): "image" | "video" | "document" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
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
