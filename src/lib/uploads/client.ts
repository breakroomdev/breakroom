export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class UploadValidationError extends Error {}

export async function uploadImageToCloudinary(file: File, onProgress?: (pct: number) => void): Promise<UploadedImage> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new UploadValidationError("Please upload a JPG, PNG, WEBP or GIF image.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadValidationError("Images must be smaller than 8MB.");
  }

  const sigRes = await fetch("/api/uploads/signature", { method: "POST" });
  if (!sigRes.ok) {
    const data = await sigRes.json().catch(() => null);
    throw new Error(data?.error?.message ?? "Couldn't start the upload.");
  }
  const sig = await sigRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sig.uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({ url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height });
      } else {
        reject(new Error("Upload failed. Please try again."));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed. Please check your connection."));
    xhr.send(form);
  });
}
