import { getR2Service } from "@minimall/core/server";
import { type NextRequest, NextResponse } from "next/server";
import { UploadSession } from "../types";

interface CancelUploadRequest {
  uploadId: string;
}

// POST /api/upload/cancel - Cancel streaming upload
export async function POST(request: NextRequest) {
  try {
    const body: CancelUploadRequest = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      return NextResponse.json({ error: "Missing required field: uploadId" }, { status: 400 });
    }

    // Get upload session
    globalThis.uploadSessions = globalThis.uploadSessions || new Map();
    const uploadSession = globalThis.uploadSessions.get(uploadId);

    if (!uploadSession) {
      // Session might already be completed or never existed
      return NextResponse.json({
        success: true,
        message: "Upload session not found (may already be completed or cancelled)",
      });
    }

    try {
      const r2Service = getR2Service();

      // Clean up any uploaded chunks
      if (uploadSession.chunks && uploadSession.chunks.size > 0) {
        const cleanupPromises: Promise<void>[] = [];

        for (const chunkIndex of uploadSession.chunks.keys()) {
          const chunkKey = `${uploadSession.key}.chunk.${chunkIndex.toString().padStart(6, "0")}`;

          cleanupPromises.push(
            r2Service.deleteObject(chunkKey).catch((error) => {
              console.warn(`Failed to delete chunk ${chunkKey} during cancellation:`, error);
            })
          );
        }

        // Wait for cleanup but don't fail if some chunks can't be deleted
        await Promise.allSettled(cleanupPromises);
      }

      // Mark session as cancelled and remove it
      uploadSession.status = "cancelled";
      globalThis.uploadSessions.delete(uploadId);

      return NextResponse.json({
        success: true,
        message: "Upload cancelled successfully",
        chunksDeleted: uploadSession.chunks?.size || 0,
      });
    } catch (cleanupError) {
      console.error("Error during upload cancellation cleanup:", cleanupError);

      // Still mark as cancelled even if cleanup partially failed
      uploadSession.status = "cancelled";
      globalThis.uploadSessions.delete(uploadId);

      return NextResponse.json({
        success: true,
        message: "Upload cancelled (some cleanup may have failed)",
        warning: "Some temporary files may not have been deleted",
      });
    }
  } catch (error) {
    console.error("Failed to cancel streaming upload:", error);

    return NextResponse.json({ error: "Failed to cancel upload" }, { status: 500 });
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
