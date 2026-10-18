"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/adminApi";
import { useAdminT } from "@/lib/adminI18n";

type Props = {
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* Client-side upload limits — keep in sync with the backend */
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Resolve a stored path like "/media/uploads/x.jpg" into a full URL for <img>. */
function resolveSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_URL}${value}`;
}

export default function ImageUploadField({ label, value, onChange }: Props) {
  const { t } = useAdminT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(
        `Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_SIZE_MB} MB.`
      );
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setPreviewBroken(false);
      onChange(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const preview = resolveSrc(value);

  return (
    <div className="admin-form-field">
      <label className="admin-form-label">{label}</label>

      <div className="admin-image-upload">
        {preview && !previewBroken ? (
          <div className="admin-image-upload-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" onError={() => setPreviewBroken(true)} />
            <button
              type="button"
              className="admin-image-upload-remove"
              onClick={() => onChange("")}
              aria-label={t("img.remove")}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="admin-image-upload-dropzone"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 size={20} className="admin-spin" />
            ) : (
              <>
                <ImagePlus size={20} />
                <span>
                  {t("img.choose")}
                </span>
              </>
            )}
          </button>
        )}

        {preview && !previewBroken && (
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? t("img.uploading") : t("img.replace")}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="admin-image-upload-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="admin-image-upload-error">{error}</p>}
      {!error && (
        <p className="admin-form-hint">
          {t("img.hint")}
        </p>
      )}
    </div>
  );
}