import "server-only";
import { v2 as cloudinary } from "cloudinary";
import type { UploadProvider, UploadSignature } from "./provider";

function configured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName, apiKey, apiSecret };
}

export const cloudinaryProvider: UploadProvider = {
  createUploadSignature(folder: string): UploadSignature {
    const { cloudName, apiKey, apiSecret } = configured();
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

    return {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    };
  },

  async deleteAsset(publicId: string): Promise<void> {
    configured();
    await cloudinary.uploader.destroy(publicId);
  },
};

export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}
