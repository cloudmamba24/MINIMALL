import { getR2Service } from "@minimall/core";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";

// POST /api/assets/upload - Upload file to R2
export async function POST(request: NextRequest) {
  try {
    const r2Service = getR2Service();
    if (!r2Service) {
      return NextResponse.json({ error: "R2 service not configured" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "";
    const fileName = `${timestamp}-${random}.${extension}`;
    const key = `${folder}/${fileName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    await r2Service.putObject(key, buffer, { contentType: file.type });

    // Get the uploaded object URL
    const url = r2Service.getObjectUrl(key);

    // Create asset record
    const asset = {
      id: key,
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      originalName: file.name,
      type: getAssetType(file.type),
      mimeType: file.type,
      size: file.size,
      url,
      folder,
      uploadedAt: new Date(),
    };

    // Add Sentry context for monitoring
    Sentry.addBreadcrumb({
      category: "asset-upload",
      message: `Uploaded asset: ${file.name}`,
      data: {
        fileName,
        size: file.size,
        type: file.type,
        folder,
      },
      level: "info",
    });

    return NextResponse.json({
      success: true,
      asset,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Failed to upload asset:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
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
