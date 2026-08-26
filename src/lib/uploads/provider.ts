/**
 * Abstraction around image hosting so Cloudinary (./cloudinary.ts) can be
 * swapped for another provider (S3, R2, etc) later without touching the
 * post composer or API routes that use it.
 */

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
}

export interface UploadProvider {
  /** Produces a short-lived signature the browser uses to upload directly to the provider. */
  createUploadSignature(folder: string): UploadSignature;
  /** Permanently deletes a previously uploaded asset. */
  deleteAsset(publicId: string): Promise<void>;
}
