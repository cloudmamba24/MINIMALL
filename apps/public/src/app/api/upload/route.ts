import { getR2Service } from "@minimall/core/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const shopId = (formData.get("shopId") as string) || "demo";
    const uploadId = formData.get("uploadId") as string; // For streaming uploads

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // For large files (>5MB), suggest using streaming upload
    const streamingThreshold = 5 * 1024 * 1024; // 5MB
    const maxSimpleUploadSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSimpleUploadSize) {
      return NextResponse.json(
        {
          error:
            "File too large for simple upload (max 10MB). Use streaming upload for files larger than 10MB.",
          suggested: "streaming",
          size: file.size,
          threshold: maxSimpleUploadSize,
        },
        { status: 413 }
      );
    }

    // Suggest streaming for files larger than 5MB but still allow simple upload
    const shouldSuggestStreaming = file.size > streamingThreshold && !uploadId;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    try {
      const r2Service = getR2Service();

      // Generate unique filename
      const timestamp = Date.now();
      const __extension = file.name.split(".").pop();
      const fileName = `${timestamp}-${file.name}`;

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to R2
      const key = `uploads/${shopId}/${fileName}`;
      await r2Service.putObject(key, buffer, {
        contentType: file.type,
      });

      // Generate public URL
      const publicUrl = r2Service.getPublicUrl(key);

      const response: Record<string, unknown> = {
        success: true,
        url: publicUrl,
        key,
        fileName,
        size: file.size,
        type: file.type,
      };

      // Add streaming suggestion for large files
      if (shouldSuggestStreaming) {
        response.suggestion = {
          message:
            "For better performance and reliability, consider using streaming upload for files larger than 5MB",
          recommended: "streaming",
          threshold: streamingThreshold,
        };
      }

      return NextResponse.json(response);
    } catch (r2Error) {
      console.error("R2 upload failed:", r2Error);

      // Fallback to base64 data URL for immediate use
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;

      const fallbackResponse: Record<string, unknown> = {
        success: true,
        url: dataUrl,
        key: null,
        fileName: file.name,
        size: file.size,
        type: file.type,
        fallback: "base64",
        warning: "R2 storage not configured, using temporary data URL",
      };

      // Add streaming suggestion for large files even in fallback
      if (shouldSuggestStreaming) {
        fallbackResponse.suggestion = {
          message:
            "For better performance, configure R2 storage and use streaming upload for files larger than 5MB",
          recommended: "streaming",
          threshold: streamingThreshold,
        };
      }

      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// GET /api/upload - Get presigned upload URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    const contentType = searchParams.get("contentType");
    const shopId = searchParams.get("shopId") || "demo";

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
    }

    const r2Service = getR2Service();
    const { url, key } = await r2Service.generateUploadUrl(shopId, filename, contentType);

    return NextResponse.json({
      uploadUrl: url,
      key,
      publicUrl: r2Service.getPublicUrl(key),
    });
  } catch (error) {
    console.error("Presigned URL generation failed:", error);
    return NextResponse.json({ error: "R2 storage not configured" }, { status: 503 });
  }
}
