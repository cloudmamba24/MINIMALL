"use client";

/**
 * Streaming Upload System for MINIMALL
 *
 * Features:
 * - Chunked file streaming for large files
 * - Progress tracking and cancellation
 * - Memory-efficient processing
 * - Automatic retry with exponential backoff
 * - Concurrent chunk uploads
 * - Client-side image compression/optimization
 */

export interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
	speed?: number; // bytes per second
	remainingTime?: number; // seconds
}

export interface UploadOptions {
	chunkSize?: number; // Default: 1MB
	maxConcurrentChunks?: number; // Default: 3
	maxRetries?: number; // Default: 3
	quality?: number; // Image compression quality (0-1)
	maxWidth?: number; // Auto-resize width
	maxHeight?: number; // Auto-resize height
	onProgress?: (progress: UploadProgress) => void;
	onComplete?: (result: UploadResult) => void;
	onError?: (error: Error) => void;
}

export interface UploadResult {
	url: string;
	key: string;
	size: number;
	type: string;
	compressed?: boolean;
	originalSize?: number;
}

export interface ChunkInfo {
	index: number;
	start: number;
	end: number;
	size: number;
	data: Blob;
	uploadId?: string;
	etag?: string;
}

export class StreamingUploader {
	private uploadId: string;
	private chunks: ChunkInfo[] = [];
	private uploadedChunks = new Set<number>();
	private aborted = false;
	private startTime = 0;

	constructor(
		private file: File,
		private options: UploadOptions = {},
	) {
		this.uploadId = this.generateUploadId();
		this.options = {
			chunkSize: 1024 * 1024, // 1MB default
			maxConcurrentChunks: 3,
			maxRetries: 3,
			quality: 0.85,
			maxWidth: 2048,
			maxHeight: 2048,
			...options,
		};
	}

	private generateUploadId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Optimize image before upload (client-side compression)
	 */
	private async optimizeImage(file: File): Promise<File> {
		if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
			return file;
		}

		return new Promise((resolve, reject) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();

			img.onload = () => {
				try {
					// Calculate dimensions
					let { width, height } = img;
					const maxWidth = this.options.maxWidth ?? 2048;
					const maxHeight = this.options.maxHeight ?? 2048;

					if (width > maxWidth || height > maxHeight) {
						const ratio = Math.min(maxWidth / width, maxHeight / height);
						width *= ratio;
						height *= ratio;
					}

					canvas.width = width;
					canvas.height = height;

					// Draw and compress
					ctx?.drawImage(img, 0, 0, width, height);

					canvas.toBlob(
						(blob) => {
							if (!blob) {
								reject(new Error("Image compression failed"));
								return;
							}

							// Create a new File from the compressed blob
							const compressedFile = new File([blob], file.name, {
								type: file.type,
								lastModified: file.lastModified,
							});

							resolve(compressedFile);
						},
						file.type,
						this.options.quality,
					);
				} catch (error) {
					reject(error);
				}
			};

			img.onerror = () =>
				reject(new Error("Failed to load image for optimization"));
			img.src = URL.createObjectURL(file);
		});
	}

	/**
	 * Split file into chunks
	 */
	private createChunks(file: File): ChunkInfo[] {
		const chunkSize = this.options.chunkSize ?? 1024 * 1024;
		const chunks: ChunkInfo[] = [];
		let start = 0;

		for (let i = 0; start < file.size; i++) {
			const end = Math.min(start + chunkSize, file.size);
			const chunkData = file.slice(start, end);

			chunks.push({
				index: i,
				start,
				end,
				size: end - start,
				data: chunkData,
			});

			start = end;
		}

		return chunks;
	}

	/**
	 * Initiate multipart upload
	 */
	private async initiateUpload(file: File): Promise<string> {
		const response = await fetch("/api/upload/initiate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				filename: file.name,
				size: file.size,
				type: file.type,
				uploadId: this.uploadId,
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to initiate upload: ${response.statusText}`);
		}

		const result = await response.json();
		return result.uploadId;
	}

	/**
	 * Upload a single chunk with retry logic
	 */
	private async uploadChunk(chunk: ChunkInfo, retryCount = 0): Promise<string> {
		try {
			const formData = new FormData();
			formData.append("chunk", chunk.data);
			formData.append("uploadId", this.uploadId);
			formData.append("chunkIndex", chunk.index.toString());

			const response = await fetch("/api/upload/chunk", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`Chunk upload failed: ${response.statusText}`);
			}

			const result = await response.json();
			return result.etag;
		} catch (error) {
			if (retryCount < (this.options.maxRetries ?? 3)) {
				// Exponential backoff
				const delay = 2 ** retryCount * 1000;
				await new Promise((resolve) => setTimeout(resolve, delay));
				return this.uploadChunk(chunk, retryCount + 1);
			}
			throw error;
		}
	}

	/**
	 * Upload chunks concurrently with progress tracking
	 */
	private async uploadChunks(): Promise<void> {
		const maxConcurrent = this.options.maxConcurrentChunks ?? 3;
		const uploadPromises: Promise<void>[] = [];
		let uploadedBytes = 0;

		const uploadChunkWithProgress = async (chunk: ChunkInfo) => {
			if (this.aborted) return;

			try {
				const etag = await this.uploadChunk(chunk);
				chunk.etag = etag;
				this.uploadedChunks.add(chunk.index);
				uploadedBytes += chunk.size;

				// Calculate and report progress
				const elapsed = (Date.now() - this.startTime) / 1000;
				const speed = uploadedBytes / elapsed;
				const remainingBytes = this.file.size - uploadedBytes;
				const remainingTime = remainingBytes / speed;

				this.options.onProgress?.({
					loaded: uploadedBytes,
					total: this.file.size,
					percentage: (uploadedBytes / this.file.size) * 100,
					speed,
					remainingTime,
				});
			} catch (error) {
				throw new Error(
					`Failed to upload chunk ${chunk.index}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		};

		// Process chunks in batches
		for (let i = 0; i < this.chunks.length; i += maxConcurrent) {
			if (this.aborted) break;

			const batch = this.chunks.slice(i, i + maxConcurrent);
			const batchPromises = batch.map(uploadChunkWithProgress);

			await Promise.all(batchPromises);
		}
	}

	/**
	 * Complete multipart upload
	 */
	private async completeUpload(): Promise<UploadResult> {
		const response = await fetch("/api/upload/complete", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				uploadId: this.uploadId,
				chunks: this.chunks.map((chunk) => ({
					index: chunk.index,
					etag: chunk.etag,
				})),
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to complete upload: ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Start the streaming upload process
	 */
	async upload(): Promise<UploadResult> {
		if (this.aborted) {
			throw new Error("Upload was cancelled");
		}

		this.startTime = Date.now();

		try {
			// Step 1: Optimize image if needed
			let fileToUpload = this.file;
			const originalSize = this.file.size;

			if (this.file.type.startsWith("image/")) {
				fileToUpload = await this.optimizeImage(this.file);
			}

			// Step 2: Check if file needs chunking
			const shouldChunk =
				fileToUpload.size > (this.options.chunkSize ?? 1024 * 1024) * 2;

			if (!shouldChunk) {
				// Use simple upload for small files
				return this.simpleUpload(fileToUpload, originalSize);
			}

			// Step 3: Create chunks
			this.chunks = this.createChunks(fileToUpload);

			// Step 4: Initiate multipart upload
			await this.initiateUpload(fileToUpload);

			// Step 5: Upload chunks concurrently
			await this.uploadChunks();

			// Step 6: Complete upload
			const result = await this.completeUpload();

			// Add compression info
			result.compressed = fileToUpload.size < originalSize;
			result.originalSize = originalSize;

			this.options.onComplete?.(result);
			return result;
		} catch (error) {
			this.options.onError?.(error as Error);
			throw error;
		}
	}

	/**
	 * Simple upload for small files
	 */
	private async simpleUpload(
		file: File,
		originalSize: number,
	): Promise<UploadResult> {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("uploadId", this.uploadId);

		const xhr = new XMLHttpRequest();

		return new Promise((resolve, reject) => {
			xhr.upload.addEventListener("progress", (event) => {
				if (event.lengthComputable) {
					const elapsed = (Date.now() - this.startTime) / 1000;
					const speed = event.loaded / elapsed;
					const remainingTime = (event.total - event.loaded) / speed;

					this.options.onProgress?.({
						loaded: event.loaded,
						total: event.total,
						percentage: (event.loaded / event.total) * 100,
						speed,
						remainingTime,
					});
				}
			});

			xhr.addEventListener("load", () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					const result = JSON.parse(xhr.responseText);
					result.compressed = file.size < originalSize;
					result.originalSize = originalSize;
					resolve(result);
				} else {
					reject(new Error(`Upload failed: ${xhr.statusText}`));
				}
			});

			xhr.addEventListener("error", () => {
				reject(new Error("Upload failed"));
			});

			xhr.addEventListener("abort", () => {
				reject(new Error("Upload cancelled"));
			});

			xhr.open("POST", "/api/upload");
			xhr.send(formData);
		});
	}

	/**
	 * Cancel the upload
	 */
	async cancel(): Promise<void> {
		this.aborted = true;

		// Cancel ongoing upload if possible
		try {
			await fetch("/api/upload/cancel", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ uploadId: this.uploadId }),
			});
		} catch (error) {
			console.warn("Failed to cancel upload on server:", error);
		}
	}
}

/**
 * Helper function to create and start streaming upload
 */
export function createStreamingUpload(
	file: File,
	options: UploadOptions = {},
): StreamingUploader {
	return new StreamingUploader(file, options);
}

/**
 * Simple streaming upload with Promise interface
 */
export async function streamingUpload(
	file: File,
	options: UploadOptions = {},
): Promise<UploadResult> {
	const uploader = new StreamingUploader(file, options);
	return uploader.upload();
}
