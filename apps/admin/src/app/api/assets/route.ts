import { getR2Service } from "@minimall/core";
import { configs, db } from "@minimall/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

interface AssetFile {
  id: string;
  name: string;
  originalName: string;
  type: "image" | "video" | "document";
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  folder?: string;
  tags?: string[];
  uploadedAt: Date;
  lastModified?: Date;
}

// GET /api/assets - List assets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "uploads";
    const type = searchParams.get("type") || "all";
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const r2Service = getR2Service();

    if (!r2Service) {
      return NextResponse.json({ error: "R2 service not configured" }, { status: 503 });
    }

    // List objects from R2
    const objects = await r2Service.listObjects(folder);

    // Convert R2 objects to AssetFile format
    const assets: AssetFile[] = objects.map((obj) => {
      const fileName = obj.key.split("/").pop() || obj.key;
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

      let assetType: AssetFile["type"] = "document";
      if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fileExtension)) {
        assetType = "image";
      } else if (["mp4", "webm", "mov", "avi"].includes(fileExtension)) {
        assetType = "video";
      }

      return {
        id: obj.key,
        name: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
        originalName: fileName,
        type: assetType,
        mimeType: getMimeType(fileExtension),
        size: obj.size || 0,
        url: obj.url || r2Service.getObjectUrl(obj.key),
        folder,
        uploadedAt: obj.lastModified || new Date(),
        lastModified: obj.lastModified,
      };
    });

    // Filter by type if specified
    const filteredAssets = type === "all" ? assets : assets.filter((asset) => asset.type === type);

    // Sort by upload date (newest first) and limit
    const sortedAssets = filteredAssets
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      assets: sortedAssets,
      total: filteredAssets.length,
    });
  } catch (error) {
    console.error("Failed to list assets:", error);
    return NextResponse.json({ error: "Failed to list assets" }, { status: 500 });
  }
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // Videos
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return mimeTypes[extension] || "application/octet-stream";
}
