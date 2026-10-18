"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage } from "@/lib/adminApi";
import { resolveMediaUrl } from "@/lib/media";
import { useAdminT } from "@/lib/adminI18n";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Multi-image uploader: shows thumbnails with a remove button + an "add" tile. */
export default function GalleryUploadField({
  label, hint, value, onChange,
}: { label: string; hint?: string; value: string[]; onChange: (urls: string[]) => void }) {
  const { t } = useAdminT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      if (!TYPES.includes(file.type) || file.size > MAX_BYTES) {
        setError(`${file.name}: ${t("img.hint")}`);
        continue;
      }
      try {
        const { url } = await uploadImage(file);
        added.push(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("anews.uploadFail"));
      }
    }
    if (added.length) onChange([...value, ...added]);
    setBusy(false);
  }

  return (
    <div className="admin-form-field is-full">
      <label className="admin-form-label">{label}</label>
      <div className="admin-gallery">
        {value.map((url, i) => (
          <div key={url + i} className="admin-gallery-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveMediaUrl(url)} alt="" />
            <button type="button" aria-label={t("img.remove")} onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <X size={13} />
            </button>
          </div>
        ))}
        <button type="button" className="admin-gallery-add" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 size={20} className="admin-spin" /> : <ImagePlus size={20} />}
          <span>{busy ? t("img.uploading") : t("anews.addImages")}</span>
        </button>
        <input
          ref={inputRef} type="file" multiple hidden accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>
      {error ? <p className="admin-image-upload-error">{error}</p> : hint && <p className="admin-form-hint">{hint}</p>}
    </div>
  );
}
