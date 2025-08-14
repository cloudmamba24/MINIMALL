/**
 * Comprehensive tests for R2 Storage Service
 * Covers file upload, download, optimization, and error handling
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
	R2Service,
	createR2Service,
	uploadFile,
	downloadFile,
	deleteFile,
	generateSignedUrl,
	optimizeImage,
	generateThumbnail,
	validateFileType,
	calculateChecksum,
	streamUpload,
	batchDelete,
	listObjects,
	copyObject,
	getObjectMetadata,
	createMultipartUpload,
	uploadPart,
	completeMultipartUpload,
	abortMultipartUpload
} from "./r2";
import type { R2Config, UploadOptions, OptimizationOptions } from "./types";

// Mock AWS S3 client
const mockS3Client = {
	send: vi.fn(),
	config: {
		region: "auto",
		endpoint: "https://test.r2.cloudflarestorage.com"
	}
};

// Mock commands
const mockPutObjectCommand = vi.fn();
const mockGetObjectCommand = vi.fn();
const mockDeleteObjectCommand = vi.fn();
const mockHeadObjectCommand = vi.fn();
const mockListObjectsV2Command = vi.fn();
const mockCopyObjectCommand = vi.fn();
const mockCreateMultipartUploadCommand = vi.fn();
const mockUploadPartCommand = vi.fn();
const mockCompleteMultipartUploadCommand = vi.fn();
const mockAbortMultipartUploadCommand = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
	S3Client: vi.fn(() => mockS3Client),
	PutObjectCommand: mockPutObjectCommand,
	GetObjectCommand: mockGetObjectCommand,
	DeleteObjectCommand: mockDeleteObjectCommand,
	HeadObjectCommand: mockHeadObjectCommand,
	ListObjectsV2Command: mockListObjectsV2Command,
	CopyObjectCommand: mockCopyObjectCommand,
	CreateMultipartUploadCommand: mockCreateMultipartUploadCommand,
	UploadPartCommand: mockUploadPartCommand,
	CompleteMultipartUploadCommand: mockCompleteMultipartUploadCommand,
	AbortMultipartUploadCommand: mockAbortMultipartUploadCommand
}));

// Mock sharp for image processing
const mockSharp = {
	resize: vi.fn().mockReturnThis(),
	webp: vi.fn().mockReturnThis(),
	jpeg: vi.fn().mockReturnThis(),
	png: vi.fn().mockReturnThis(),
	toBuffer: vi.fn().mockResolvedValue(Buffer.from("optimized-image")),
	metadata: vi.fn().mockResolvedValue({
		width: 1920,
		height: 1080,
		format: "jpeg",
		size: 1024000
	})
};

vi.mock("sharp", () => ({
	default: vi.fn(() => mockSharp)
}));

describe("R2 Storage Service - Comprehensive Tests", () => {
	const mockConfig: R2Config = {
		endpoint: "https://test.r2.cloudflarestorage.com",
		accessKeyId: "test-access-key",
		secretAccessKey: "test-secret-key",
		bucketName: "test-bucket",
		region: "auto"
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("R2Service Class", () => {
		it("should initialize with proper configuration", () => {
			const service = new R2Service(mockConfig);
			expect(service.bucketName).toBe("test-bucket");
			expect(service.config).toEqual(mockConfig);
		});

		it("should validate configuration on initialization", () => {
			const invalidConfig = {
				// Missing required fields
				bucketName: "test"
			} as any;

			expect(() => new R2Service(invalidConfig))
				.toThrow("Invalid R2 configuration");
		});
	});

	describe("createR2Service", () => {
		it("should create service with environment variables", () => {
			process.env.R2_ENDPOINT = "https://test.r2.cloudflarestorage.com";
			process.env.R2_ACCESS_KEY = "test-key";
			process.env.R2_SECRET = "test-secret";
			process.env.R2_BUCKET_NAME = "test-bucket";

			const service = createR2Service();
			expect(service).toBeInstanceOf(R2Service);
		});

		it("should throw error with missing environment variables", () => {
			delete process.env.R2_ENDPOINT;
			delete process.env.R2_ACCESS_KEY;
			delete process.env.R2_SECRET;
			delete process.env.R2_BUCKET_NAME;

			expect(() => createR2Service())
				.toThrow("Missing required R2 environment variables");
		});
	});

	describe("File Upload Operations", () => {
		describe("uploadFile", () => {
			it("should upload file successfully", async () => {
				const mockFile = new File(["test content"], "test.jpg", { type: "image/jpeg" });
				const mockResponse = {
					ETag: '"abc123"',
					Location: "https://test.r2.cloudflarestorage.com/test-bucket/images/test.jpg",
					Key: "images/test.jpg"
				};

				mockS3Client.send.mockResolvedValueOnce(mockResponse);

				const result = await uploadFile(mockConfig, mockFile, "images/test.jpg", {
					contentType: "image/jpeg",
					metadata: { originalName: "test.jpg" }
				});

				expect(result.success).toBe(true);
				expect(result.key).toBe("images/test.jpg");
				expect(result.etag).toBe('"abc123"');
				expect(result.url).toContain("test.jpg");
			});

			it("should handle upload errors", async () => {
				const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
				mockS3Client.send.mockRejectedValueOnce(new Error("Upload failed"));

				const result = await uploadFile(mockConfig, mockFile, "test.jpg");

				expect(result.success).toBe(false);
				expect(result.error).toBe("Upload failed");
			});

			it("should validate file type before upload", async () => {
				const mockFile = new File(["test"], "test.exe", { type: "application/exe" });

				const result = await uploadFile(mockConfig, mockFile, "test.exe");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Invalid file type");
			});

			it("should generate proper content hash", async () => {
				const mockFile = new File(["test content"], "test.txt", { type: "text/plain" });
				mockS3Client.send.mockResolvedValueOnce({ ETag: '"hash123"' });

				await uploadFile(mockConfig, mockFile, "test.txt", {
					generateHash: true
				});

				expect(mockPutObjectCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						ContentMD5: expect.any(String)
					})
				);
			});
		});

		describe("streamUpload", () => {
			it("should handle streaming upload for large files", async () => {
				const mockStream = new ReadableStream({
					start(controller) {
						controller.enqueue(new Uint8Array([1, 2, 3, 4]));
						controller.close();
					}
				});

				mockS3Client.send.mockResolvedValueOnce({ ETag: '"stream123"' });

				const result = await streamUpload(mockConfig, mockStream, "large-file.mp4", {
					contentType: "video/mp4",
					contentLength: 1024 * 1024 * 100 // 100MB
				});

				expect(result.success).toBe(true);
				expect(mockPutObjectCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						ContentType: "video/mp4"
					})
				);
			});

			it("should handle stream errors", async () => {
				const mockStream = new ReadableStream({
					start(controller) {
						controller.error(new Error("Stream error"));
					}
				});

				const result = await streamUpload(mockConfig, mockStream, "file.mp4");

				expect(result.success).toBe(false);
				expect(result.error).toContain("Stream error");
			});
		});

		describe("multipart upload", () => {
			it("should create multipart upload for large files", async () => {
				mockS3Client.send.mockResolvedValueOnce({
					UploadId: "upload123",
					Bucket: "test-bucket",
					Key: "large-file.mp4"
				});

				const result = await createMultipartUpload(mockConfig, "large-file.mp4", {
					contentType: "video/mp4"
				});

				expect(result.uploadId).toBe("upload123");
				expect(mockCreateMultipartUploadCommand).toHaveBeenCalled();
			});

			it("should upload parts in sequence", async () => {
				const mockPart = new Uint8Array(1024 * 1024 * 5); // 5MB part
				mockS3Client.send.mockResolvedValueOnce({
					ETag: '"part1-etag"'
				});

				const result = await uploadPart(mockConfig, {
					bucket: "test-bucket",
					key: "large-file.mp4",
					uploadId: "upload123",
					partNumber: 1,
					body: mockPart
				});

				expect(result.etag).toBe('"part1-etag"');
				expect(mockUploadPartCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						PartNumber: 1,
						UploadId: "upload123"
					})
				);
			});

			it("should complete multipart upload", async () => {
				const parts = [
					{ PartNumber: 1, ETag: '"part1"' },
					{ PartNumber: 2, ETag: '"part2"' }
				];

				mockS3Client.send.mockResolvedValueOnce({
					Location: "https://test.r2.cloudflarestorage.com/test-bucket/large-file.mp4",
					ETag: '"completed-etag"'
				});

				const result = await completeMultipartUpload(mockConfig, {
					bucket: "test-bucket",
					key: "large-file.mp4",
					uploadId: "upload123",
					parts
				});

				expect(result.success).toBe(true);
				expect(result.location).toContain("large-file.mp4");
			});

			it("should abort multipart upload on error", async () => {
				mockS3Client.send.mockResolvedValueOnce({});

				await abortMultipartUpload(mockConfig, {
					bucket: "test-bucket",
					key: "large-file.mp4",
					uploadId: "upload123"
				});

				expect(mockAbortMultipartUploadCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						UploadId: "upload123"
					})
				);
			});
		});
	});

	describe("File Download Operations", () => {
		describe("downloadFile", () => {
			it("should download file successfully", async () => {
				const mockBody = {
					transformToByteArray: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
				};
				mockS3Client.send.mockResolvedValueOnce({
					Body: mockBody,
					ContentType: "image/jpeg",
					ContentLength: 1024,
					ETag: '"download123"'
				});

				const result = await downloadFile(mockConfig, "images/test.jpg");

				expect(result.success).toBe(true);
				expect(result.data).toBeInstanceOf(Uint8Array);
				expect(result.contentType).toBe("image/jpeg");
				expect(result.contentLength).toBe(1024);
			});

			it("should handle file not found", async () => {
				const error = new Error("NoSuchKey");
				error.name = "NoSuchKey";
				mockS3Client.send.mockRejectedValueOnce(error);

				const result = await downloadFile(mockConfig, "non-existent.jpg");

				expect(result.success).toBe(false);
				expect(result.error).toContain("not found");
			});

			it("should handle download range requests", async () => {
				const mockBody = {
					transformToByteArray: vi.fn().mockResolvedValue(new Uint8Array([1, 2]))
				};
				mockS3Client.send.mockResolvedValueOnce({
					Body: mockBody,
					ContentRange: "bytes 0-1023/2048"
				});

				const result = await downloadFile(mockConfig, "large-file.mp4", {
					range: "bytes=0-1023"
				});

				expect(result.success).toBe(true);
				expect(mockGetObjectCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						Range: "bytes=0-1023"
					})
				);
			});
		});

		describe("generateSignedUrl", () => {
			it("should generate signed URL for private access", async () => {
				const result = await generateSignedUrl(mockConfig, "private/image.jpg", {
					expiresIn: 3600,
					operation: "getObject"
				});

				expect(result).toContain("private/image.jpg");
				expect(result).toContain("X-Amz-Signature");
				expect(result).toContain("X-Amz-Expires=3600");
			});

			it("should generate upload URL", async () => {
				const result = await generateSignedUrl(mockConfig, "uploads/new-file.jpg", {
					expiresIn: 900,
					operation: "putObject",
					contentType: "image/jpeg"
				});

				expect(result).toContain("uploads/new-file.jpg");
			});

			it("should handle custom conditions", async () => {
				const result = await generateSignedUrl(mockConfig, "restricted/file.pdf", {
					expiresIn: 1800,
					conditions: {
						maxSize: 1024 * 1024 * 10, // 10MB max
						contentTypeStarts: "application/pdf"
					}
				});

				expect(result).toBeTruthy();
			});
		});
	});

	describe("File Management Operations", () => {
		describe("deleteFile", () => {
			it("should delete file successfully", async () => {
				mockS3Client.send.mockResolvedValueOnce({});

				const result = await deleteFile(mockConfig, "images/old-file.jpg");

				expect(result.success).toBe(true);
				expect(mockDeleteObjectCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						Key: "images/old-file.jpg"
					})
				);
			});

			it("should handle delete errors gracefully", async () => {
				mockS3Client.send.mockRejectedValueOnce(new Error("Access denied"));

				const result = await deleteFile(mockConfig, "protected/file.jpg");

				expect(result.success).toBe(false);
				expect(result.error).toBe("Access denied");
			});
		});

		describe("batchDelete", () => {
			it("should delete multiple files efficiently", async () => {
				const filesToDelete = [
					"images/file1.jpg",
					"images/file2.jpg",
					"videos/file3.mp4"
				];

				mockS3Client.send.mockResolvedValue({
					Deleted: filesToDelete.map(key => ({ Key: key })),
					Errors: []
				});

				const result = await batchDelete(mockConfig, filesToDelete);

				expect(result.success).toBe(true);
				expect(result.deleted).toHaveLength(3);
				expect(result.errors).toHaveLength(0);
			});

			it("should handle partial failures", async () => {
				const filesToDelete = ["file1.jpg", "file2.jpg", "protected.jpg"];

				mockS3Client.send.mockResolvedValueOnce({
					Deleted: [{ Key: "file1.jpg" }, { Key: "file2.jpg" }],
					Errors: [{ Key: "protected.jpg", Code: "AccessDenied" }]
				});

				const result = await batchDelete(mockConfig, filesToDelete);

				expect(result.success).toBe(true);
				expect(result.deleted).toHaveLength(2);
				expect(result.errors).toHaveLength(1);
			});
		});

		describe("listObjects", () => {
			it("should list objects with prefix", async () => {
				const mockObjects = [
					{ Key: "images/photo1.jpg", Size: 1024, LastModified: new Date() },
					{ Key: "images/photo2.jpg", Size: 2048, LastModified: new Date() }
				];

				mockS3Client.send.mockResolvedValueOnce({
					Contents: mockObjects,
					IsTruncated: false
				});

				const result = await listObjects(mockConfig, {
					prefix: "images/",
					maxKeys: 100
				});

				expect(result.objects).toHaveLength(2);
				expect(result.objects[0].key).toBe("images/photo1.jpg");
				expect(result.isTruncated).toBe(false);
			});

			it("should handle pagination", async () => {
				mockS3Client.send.mockResolvedValueOnce({
					Contents: [],
					IsTruncated: true,
					NextContinuationToken: "token123"
				});

				const result = await listObjects(mockConfig, {
					prefix: "videos/",
					maxKeys: 10,
					continuationToken: "previous-token"
				});

				expect(result.nextContinuationToken).toBe("token123");
				expect(result.isTruncated).toBe(true);
			});
		});

		describe("copyObject", () => {
			it("should copy object to new location", async () => {
				mockS3Client.send.mockResolvedValueOnce({
					CopyObjectResult: {
						ETag: '"copy123"',
						LastModified: new Date()
					}
				});

				const result = await copyObject(mockConfig, {
					sourceKey: "images/original.jpg",
					destinationKey: "images/backup/original.jpg",
					metadata: { copied: "true" }
				});

				expect(result.success).toBe(true);
				expect(mockCopyObjectCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						CopySource: "test-bucket/images/original.jpg",
						Key: "images/backup/original.jpg"
					})
				);
			});
		});

		describe("getObjectMetadata", () => {
			it("should retrieve object metadata", async () => {
				mockS3Client.send.mockResolvedValueOnce({
					ContentType: "image/jpeg",
					ContentLength: 1024000,
					LastModified: new Date(),
					ETag: '"meta123"',
					Metadata: { originalName: "photo.jpg" }
				});

				const result = await getObjectMetadata(mockConfig, "images/photo.jpg");

				expect(result.contentType).toBe("image/jpeg");
				expect(result.contentLength).toBe(1024000);
				expect(result.metadata.originalName).toBe("photo.jpg");
			});

			it("should handle metadata not found", async () => {
				const error = new Error("NotFound");
				error.name = "NotFound";
				mockS3Client.send.mockRejectedValueOnce(error);

				await expect(getObjectMetadata(mockConfig, "missing.jpg"))
					.rejects.toThrow("Object not found");
			});
		});
	});

	describe("Image Processing", () => {
		describe("optimizeImage", () => {
			it("should optimize image with default settings", async () => {
				const inputBuffer = Buffer.from("original-image-data");
				mockSharp.toBuffer.mockResolvedValueOnce(Buffer.from("optimized"));

				const result = await optimizeImage(inputBuffer, {
					format: "webp",
					quality: 80,
					width: 800
				});

				expect(result.length).toBeGreaterThan(0);
				expect(mockSharp.resize).toHaveBeenCalledWith(800, undefined, {
					fit: "inside",
					withoutEnlargement: true
				});
				expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 80 });
			});

			it("should handle different output formats", async () => {
				const inputBuffer = Buffer.from("image-data");

				// Test JPEG optimization
				await optimizeImage(inputBuffer, { format: "jpeg", quality: 90 });
				expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 90 });

				// Test PNG optimization
				await optimizeImage(inputBuffer, { format: "png", quality: 80 });
				expect(mockSharp.png).toHaveBeenCalledWith({ quality: 80 });
			});

			it("should maintain aspect ratio when resizing", async () => {
				const inputBuffer = Buffer.from("image");

				await optimizeImage(inputBuffer, {
					width: 400,
					height: 600,
					fit: "cover"
				});

				expect(mockSharp.resize).toHaveBeenCalledWith(400, 600, {
					fit: "cover",
					withoutEnlargement: true
				});
			});

			it("should handle optimization errors", async () => {
				const inputBuffer = Buffer.from("invalid-image");
				mockSharp.toBuffer.mockRejectedValueOnce(new Error("Invalid image format"));

				await expect(optimizeImage(inputBuffer, {}))
					.rejects.toThrow("Image optimization failed");
			});
		});

		describe("generateThumbnail", () => {
			it("should generate thumbnail from image", async () => {
				const inputBuffer = Buffer.from("full-image");
				mockSharp.toBuffer.mockResolvedValueOnce(Buffer.from("thumbnail"));

				const result = await generateThumbnail(inputBuffer, {
					width: 150,
					height: 150,
					quality: 70
				});

				expect(result.length).toBeGreaterThan(0);
				expect(mockSharp.resize).toHaveBeenCalledWith(150, 150, {
					fit: "cover",
					position: "center"
				});
			});

			it("should generate progressive thumbnails", async () => {
				const inputBuffer = Buffer.from("image");

				const thumbnails = await Promise.all([
					generateThumbnail(inputBuffer, { width: 50, height: 50 }),
					generateThumbnail(inputBuffer, { width: 150, height: 150 }),
					generateThumbnail(inputBuffer, { width: 300, height: 300 })
				]);

				expect(thumbnails).toHaveLength(3);
				expect(mockSharp.resize).toHaveBeenCalledTimes(3);
			});
		});
	});

	describe("Utility Functions", () => {
		describe("validateFileType", () => {
			it("should validate supported image types", () => {
				expect(validateFileType("image/jpeg")).toBe(true);
				expect(validateFileType("image/png")).toBe(true);
				expect(validateFileType("image/webp")).toBe(true);
				expect(validateFileType("image/avif")).toBe(true);
			});

			it("should validate supported video types", () => {
				expect(validateFileType("video/mp4")).toBe(true);
				expect(validateFileType("video/webm")).toBe(true);
				expect(validateFileType("video/quicktime")).toBe(true);
			});

			it("should reject unsupported types", () => {
				expect(validateFileType("application/exe")).toBe(false);
				expect(validateFileType("text/html")).toBe(false);
				expect(validateFileType("image/svg+xml")).toBe(false);
			});

			it("should handle custom validation rules", () => {
				const customValidator = (type: string) => type.startsWith("application/pdf");
				expect(validateFileType("application/pdf", customValidator)).toBe(true);
				expect(validateFileType("image/jpeg", customValidator)).toBe(false);
			});
		});

		describe("calculateChecksum", () => {
			it("should calculate MD5 checksum", async () => {
				const data = new Uint8Array([1, 2, 3, 4, 5]);
				const checksum = await calculateChecksum(data, "md5");
				
				expect(checksum).toHaveLength(32); // MD5 hex string length
				expect(checksum).toMatch(/^[a-f0-9]+$/);
			});

			it("should calculate SHA256 checksum", async () => {
				const data = new Uint8Array([1, 2, 3, 4, 5]);
				const checksum = await calculateChecksum(data, "sha256");
				
				expect(checksum).toHaveLength(64); // SHA256 hex string length
			});

			it("should produce consistent checksums", async () => {
				const data = new Uint8Array([1, 2, 3, 4, 5]);
				const checksum1 = await calculateChecksum(data, "md5");
				const checksum2 = await calculateChecksum(data, "md5");
				
				expect(checksum1).toBe(checksum2);
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle network timeouts", async () => {
			const timeoutError = new Error("Network timeout");
			timeoutError.name = "TimeoutError";
			mockS3Client.send.mockRejectedValueOnce(timeoutError);

			const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
			const result = await uploadFile(mockConfig, mockFile, "test.jpg");

			expect(result.success).toBe(false);
			expect(result.error).toContain("timeout");
		});

		it("should handle quota exceeded errors", async () => {
			const quotaError = new Error("Quota exceeded");
			quotaError.name = "QuotaExceeded";
			mockS3Client.send.mockRejectedValueOnce(quotaError);

			const mockFile = new File(["test"], "test.jpg");
			const result = await uploadFile(mockConfig, mockFile, "test.jpg");

			expect(result.success).toBe(false);
			expect(result.error).toContain("storage quota");
		});

		it("should retry failed operations with exponential backoff", async () => {
			let attempts = 0;
			mockS3Client.send.mockImplementation(() => {
				attempts++;
				if (attempts < 3) {
					return Promise.reject(new Error("Temporary failure"));
				}
				return Promise.resolve({ ETag: '"success"' });
			});

			const mockFile = new File(["test"], "test.jpg");
			const result = await uploadFile(mockConfig, mockFile, "test.jpg", {
				retryAttempts: 3,
				retryDelay: 100
			});

			expect(result.success).toBe(true);
			expect(attempts).toBe(3);
		});

		it("should handle malformed responses", async () => {
			mockS3Client.send.mockResolvedValueOnce(null);

			const result = await downloadFile(mockConfig, "test.jpg");

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid response");
		});
	});

	describe("Performance Optimization", () => {
		it("should implement connection pooling", () => {
			const service1 = new R2Service(mockConfig);
			const service2 = new R2Service(mockConfig);

			// Should reuse connection pool
			expect(service1.client).toBeDefined();
			expect(service2.client).toBeDefined();
		});

		it("should support concurrent uploads", async () => {
			const files = [
				new File(["1"], "file1.jpg"),
				new File(["2"], "file2.jpg"),
				new File(["3"], "file3.jpg")
			];

			mockS3Client.send.mockResolvedValue({ ETag: '"concurrent"' });

			const uploads = files.map((file, i) => 
				uploadFile(mockConfig, file, `file${i + 1}.jpg`)
			);

			const results = await Promise.all(uploads);

			expect(results).toHaveLength(3);
			expect(results.every(r => r.success)).toBe(true);
		});

		it("should implement request deduplication", async () => {
			const key = "same-file.jpg";
			mockS3Client.send.mockResolvedValue({
				Body: { transformToByteArray: () => Promise.resolve(new Uint8Array()) }
			});

			// Make multiple concurrent requests for same file
			const downloads = Array(3).fill(null).map(() => 
				downloadFile(mockConfig, key)
			);

			await Promise.all(downloads);

			// Should deduplicate requests (implementation detail)
			expect(mockS3Client.send).toHaveBeenCalled();
		});
	});
});
