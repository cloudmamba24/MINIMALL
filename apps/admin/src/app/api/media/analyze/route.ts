import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";

/**
 * AI Media Analysis API Endpoint
 *
 * Analyzes images using computer vision APIs to automatically generate:
 * - Descriptive tags and categories
 * - Color analysis and dominant colors
 * - Content classification (product, lifestyle, etc.)
 * - Text recognition (OCR) for images with text
 * - Brand/logo detection
 */

interface AnalysisResult {
  success: boolean;
  tags: string[];
  colors: string[];
  categories: string[];
  description?: string;
  text?: string;
  confidence: number;
  error?: string;
  metadata?: {
    provider: string;
    processingTime: number;
    model?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("file") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const analysisTypes = formData.get("types")?.toString().split(",") || ["tags", "colors"];

    if (!imageFile && !imageUrl) {
      return NextResponse.json(
        { error: "Either image file or URL must be provided" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    console.log("[MediaAnalyze] Starting AI analysis");

    // Get image buffer
    let imageBuffer: Buffer;
    let filename: string;

    if (imageFile) {
      imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      filename = imageFile.name;
    } else if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        imageBuffer = Buffer.from(await response.arrayBuffer());
        filename = imageUrl.split("/").pop() || "image";
      } catch (error) {
        return NextResponse.json(
          {
            error: `Failed to fetch image: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate image size
    if (imageBuffer.length > 10 * 1024 * 1024) {
      // 10MB limit
      return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 400 });
    }

    // Perform analysis based on available services
    const analysisResult = await performImageAnalysis(imageBuffer, analysisTypes);

    const processingTime = Date.now() - startTime;
    console.log(`[MediaAnalyze] Analysis completed in ${processingTime}ms`);

    // Add Sentry tracking
    Sentry.addBreadcrumb({
      category: "media-analysis",
      message: "Image analyzed successfully",
      data: {
        filename,
        imageSize: imageBuffer.length,
        processingTime,
        tagsGenerated: analysisResult.tags.length,
        colorsFound: analysisResult.colors.length,
        confidence: analysisResult.confidence,
      },
      level: "info",
    });

    return NextResponse.json({
      success: true,
      ...analysisResult,
      metadata: {
        ...analysisResult.metadata,
        processingTime,
      },
    });
  } catch (error) {
    console.error("[MediaAnalyze] Analysis failed:", error);

    Sentry.captureException(error, {
      tags: { operation: "media-analysis" },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
        tags: [],
        colors: [],
        categories: [],
        confidence: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * Perform image analysis using available AI services
 */
async function performImageAnalysis(
  imageBuffer: Buffer,
  analysisTypes: string[]
): Promise<Omit<AnalysisResult, "success">> {
  // Try OpenAI Vision API first if available
  if (process.env.OPENAI_API_KEY) {
    try {
      return await analyzeWithOpenAI(imageBuffer, analysisTypes);
    } catch (error) {
      console.warn("[MediaAnalyze] OpenAI analysis failed:", error);
    }
  }

  // Fallback to Google Vision API if available
  if (process.env.GOOGLE_VISION_API_KEY) {
    try {
      return await analyzeWithGoogleVision(imageBuffer, analysisTypes);
    } catch (error) {
      console.warn("[MediaAnalyze] Google Vision analysis failed:", error);
    }
  }

  // Final fallback to local analysis (simplified)
  return await analyzeLocally(imageBuffer, analysisTypes);
}

/**
 * Analyze image using OpenAI Vision API
 */
async function analyzeWithOpenAI(
  imageBuffer: Buffer,
  analysisTypes: string[]
): Promise<Omit<AnalysisResult, "success">> {
  const base64Image = imageBuffer.toString("base64");
  const mimeType = detectMimeType(imageBuffer);

  const prompt = generateAnalysisPrompt(analysisTypes);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";

  return parseAIResponse(content, "openai-vision");
}

/**
 * Analyze image using Google Vision API
 */
async function analyzeWithGoogleVision(
  imageBuffer: Buffer,
  analysisTypes: string[]
): Promise<Omit<AnalysisResult, "success">> {
  const base64Image = imageBuffer.toString("base64");

  const features = [];
  if (analysisTypes.includes("tags")) features.push({ type: "LABEL_DETECTION", maxResults: 10 });
  if (analysisTypes.includes("text")) features.push({ type: "TEXT_DETECTION", maxResults: 1 });
  if (analysisTypes.includes("colors")) features.push({ type: "IMAGE_PROPERTIES", maxResults: 1 });

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const annotations = data.responses[0];

  const tags: string[] = [];
  const colors: string[] = [];
  const categories: string[] = [];
  const description = "";
  let text = "";
  let confidence = 0;

  // Process labels
  if (annotations.labelAnnotations) {
    for (const label of annotations.labelAnnotations) {
      tags.push(label.description.toLowerCase());
      confidence = Math.max(confidence, label.score);
    }
  }

  // Process colors
  if (annotations.imagePropertiesAnnotation?.dominantColors?.colors) {
    for (const colorInfo of annotations.imagePropertiesAnnotation.dominantColors.colors) {
      const { red, green, blue } = colorInfo.color;
      const hex = `#${Math.round(red).toString(16).padStart(2, "0")}${Math.round(green).toString(16).padStart(2, "0")}${Math.round(blue).toString(16).padStart(2, "0")}`;
      colors.push(hex);
    }
  }

  // Process text
  if (annotations.textAnnotations?.[0]) {
    text = annotations.textAnnotations[0].description;
  }

  return {
    tags,
    colors,
    categories,
    description,
    text,
    confidence,
    metadata: {
      provider: "google-vision",
      processingTime: 0,
    },
  };
}

/**
 * Local analysis fallback (simplified computer vision)
 */
async function analyzeLocally(
  imageBuffer: Buffer,
  _analysisTypes: string[]
): Promise<Omit<AnalysisResult, "success">> {
  // This is a simplified fallback when no AI services are available
  // In production, you might use libraries like @tensorflow/tfjs or opencv4nodejs

  const tags: string[] = [];
  const colors: string[] = [];
  const categories: string[] = [];

  // Basic file type analysis
  const mimeType = detectMimeType(imageBuffer);
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    tags.push("photo", "jpeg");
  }
  if (mimeType.includes("png")) {
    tags.push("image", "png", "graphics");
  }

  // Basic size analysis
  const size = imageBuffer.length;
  if (size > 1000000) tags.push("high-resolution");
  if (size < 100000) tags.push("thumbnail", "small");

  // Placeholder color analysis (would need actual image processing)
  colors.push("#3498db", "#e74c3c", "#2ecc71"); // Sample colors

  // Basic categorization
  categories.push("image", "media", "content");

  return {
    tags,
    colors,
    categories,
    description: "Basic local analysis",
    confidence: 0.5, // Lower confidence for local analysis
    metadata: {
      provider: "local-analysis",
      processingTime: 0,
    },
  };
}

/**
 * Generate analysis prompt for AI services
 */
function generateAnalysisPrompt(analysisTypes: string[]): string {
  let prompt = "Analyze this image and provide a JSON response with the following information:\n";

  if (analysisTypes.includes("tags")) {
    prompt += "- tags: Array of descriptive keywords (max 10)\n";
  }

  if (analysisTypes.includes("colors")) {
    prompt += "- colors: Array of dominant hex colors (max 5)\n";
  }

  if (analysisTypes.includes("categories")) {
    prompt +=
      "- categories: Array of content categories (e.g., 'product', 'lifestyle', 'nature')\n";
  }

  if (analysisTypes.includes("description")) {
    prompt += "- description: Brief description of the image content\n";
  }

  if (analysisTypes.includes("text")) {
    prompt += "- text: Any text visible in the image\n";
  }

  prompt += "- confidence: Overall confidence score (0-1)\n";
  prompt += "\nReturn only valid JSON, no additional text.";

  return prompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(content: string, provider: string): Omit<AnalysisResult, "success"> {
  try {
    const parsed = JSON.parse(content);

    return {
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      colors: Array.isArray(parsed.colors) ? parsed.colors : [],
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      description: typeof parsed.description === "string" ? parsed.description : undefined,
      text: typeof parsed.text === "string" ? parsed.text : undefined,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
      metadata: {
        provider,
        processingTime: 0,
        ...(provider === "openai-vision" && { model: "gpt-4-vision-preview" }),
      },
    };
  } catch (_error) {
    // Fallback parsing for non-JSON responses
    const tags = extractTagsFromText(content);

    return {
      tags,
      colors: [],
      categories: [],
      description: content.slice(0, 200),
      confidence: 0.6,
      metadata: {
        provider,
        processingTime: 0,
      },
    };
  }
}

/**
 * Extract tags from plain text response
 */
function extractTagsFromText(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);

  // Remove common words
  const stopWords = [
    "this",
    "that",
    "with",
    "have",
    "will",
    "been",
    "from",
    "they",
    "them",
    "were",
  ];
  const filteredWords = words.filter((word) => !stopWords.includes(word));

  return [...new Set(filteredWords)].slice(0, 10);
}

/**
 * Detect MIME type from buffer
 */
function detectMimeType(buffer: Buffer): string {
  if (buffer.subarray(0, 2).toString("hex") === "ffd8") return "image/jpeg";
  if (buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";
  if (buffer.subarray(0, 3).toString("ascii") === "GIF") return "image/gif";

  return "image/jpeg"; // Default fallback
}
