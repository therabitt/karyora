"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { requestArtworkUploadUrlAction } from "@/app/actions/upload";

interface ImageUploaderProps {
  onUploadSuccess?: (uploadId: string) => void;
  currentImageUrl?: string | null;
  disabled?: boolean;
}

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MiB = 26,214,400 bytes
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({
  onUploadSuccess,
  currentImageUrl,
  disabled = false,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [uploadId, setUploadId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // 1. Client-side UX validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Invalid format. Allowed formats: JPEG, PNG, WebP.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MiB). Maximum allowed is 25.0 MiB.`
      );
      return;
    }

    // Local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      // 2. Request signed upload URL from server
      const reqRes = await requestArtworkUploadUrlAction({
        filename: file.name,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
        sizeBytes: file.size,
        purpose: "artwork_source",
      });

      if (!reqRes.success || !reqRes.data) {
        throw new Error(reqRes.error || "Failed to initiate secure upload.");
      }

      setUploadProgress(45);

      // 3. Upload directly to Supabase Storage signed upload URL
      const uploadRes = await fetch(reqRes.data.signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status: ${uploadRes.status} ${uploadRes.statusText}`);
      }

      setUploadProgress(100);
      setUploadId(reqRes.data.uploadId);
      if (onUploadSuccess) {
        onUploadSuccess(reqRes.data.uploadId);
      }
    } catch (err: unknown) {
      console.error("Direct upload error:", err);
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload file to storage."
      );
      setUploadId("");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden input to pass upload_id to parent form */}
      <input type="hidden" name="upload_id" value={uploadId} />

      <label className="block text-sm font-medium text-ink">
        Artwork Image File *
      </label>

      <div
        className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors ${
          uploadError
            ? "border-danger/50 bg-danger/5"
            : uploadId
            ? "border-accent/50 bg-accent-soft/20"
            : "border-border hover:border-border-strong bg-surface"
        }`}
      >
        {previewUrl ? (
          <div className="space-y-4 w-full flex flex-col items-center">
            <div className="relative max-h-72 w-full flex items-center justify-center overflow-hidden rounded-xl bg-surface-muted border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-72 w-auto object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center gap-3">
              {uploadId && (
                <span className="text-xs font-semibold text-accent inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Image Staged Securely
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || disabled}
              >
                Choose Different File
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-surface-muted flex items-center justify-center text-text-muted text-xl">
              ↑
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-ink">
                Click to upload source image
              </p>
              <p className="text-xs text-text-muted">
                JPEG, PNG, or WebP up to 25 MiB (max 10,000 × 10,000 px)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
            >
              Browse Files
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading || disabled}
          className="hidden"
        />
      </div>

      {isUploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Uploading directly to storage...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all motion-transition-ui rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-danger font-medium">{uploadError}</p>
      )}
    </div>
  );
}
