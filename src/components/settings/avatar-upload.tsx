"use client";

import * as React from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { uploadImageToCloudinary, UploadValidationError } from "@/lib/uploads/client";

export function AvatarUpload({ name, url, onChange }: { name: string; url: string | null; onChange: (url: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadImageToCloudinary(file);
      onChange(uploaded.url);
    } catch (err) {
      toast.error(err instanceof UploadValidationError ? err.message : "Couldn't upload your photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <Avatar name={name} src={url} size="xl" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-soft transition-transform hover:scale-105"
        aria-label="Change photo"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
