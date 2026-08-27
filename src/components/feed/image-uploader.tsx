"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImageToCloudinary, UploadValidationError, type UploadedImage } from "@/lib/uploads/client";
import { cn } from "@/lib/utils";

interface PendingImage {
  id: string;
  previewUrl: string;
  progress: number;
  uploaded?: UploadedImage;
  error?: string;
}

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
}

export function ImageUploader({ value, onChange, max = 6 }: ImageUploaderProps) {
  const [pending, setPending] = React.useState<PendingImage[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const totalCount = value.length + pending.length;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = max - totalCount;
    const list = Array.from(files).slice(0, Math.max(remaining, 0));
    if (list.length === 0 && files.length > 0) {
      toast.error(`You can attach up to ${max} images.`);
      return;
    }

    for (const file of list) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      setPending((p) => [...p, { id, previewUrl, progress: 0 }]);

      uploadImageToCloudinary(file, (pct) => {
        setPending((p) => p.map((img) => (img.id === id ? { ...img, progress: pct } : img)));
      })
        .then((uploaded) => {
          setPending((p) => p.filter((img) => img.id !== id));
          onChange([...value, uploaded]);
        })
        .catch((err) => {
          const message = err instanceof UploadValidationError ? err.message : "Upload failed. Please try again.";
          setPending((p) => p.map((img) => (img.id === id ? { ...img, error: message } : img)));
        });
    }
  }

  function removeUploaded(publicId: string) {
    onChange(value.filter((v) => v.publicId !== publicId));
  }

  function dismissError(id: string) {
    setPending((p) => p.filter((img) => img.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((img) => (
          <div key={img.publicId} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border">
            <Image src={img.url} alt="Photo attached to your post" fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeUploaded(img.publicId)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {pending.map((img) => (
          <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.previewUrl} alt="Uploading photo" className="h-full w-full object-cover" />
            {img.error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/90 p-1.5 text-center">
                <p className="text-[10px] font-medium leading-tight text-white">{img.error}</p>
                <button type="button" onClick={() => dismissError(img.id)} className="text-[10px] font-semibold text-white underline">
                  Remove
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>
        ))}

        {totalCount < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors",
              "hover:border-primary/50 hover:text-primary"
            )}
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs font-medium">Add photo</span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
