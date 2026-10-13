"use client";

/* eslint-disable @next/next/no-img-element -- photos are served by our own authenticated route */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { deletePhoto } from "@/lib/actions";
import { toast } from "./client";

const FULL_MAX = 1600;
const THUMB_MAX = 400;
// 6 photos × 550 KB + thumbnails stays under the 4 MB upload limit (and Vercel's 4.5 MB cap).
const FULL_BUDGET = 550_000;

type Picked = { key: string; full: File; thumb: File; url: string; w: number; h: number };

async function toJpeg(bitmap: ImageBitmap, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // flatten transparent PNGs
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("encode failed");
  return { blob, w, h };
}

/** Resize in the browser so phone photos (often 5–10 MB) upload quickly over mobile data. */
async function prepare(file: File): Promise<Picked> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    let full = await toJpeg(bitmap, FULL_MAX, 0.82);
    for (const q of [0.72, 0.62, 0.52]) {
      if (full.blob.size <= FULL_BUDGET) break;
      full = await toJpeg(bitmap, FULL_MAX, q);
    }
    // Very detailed images: step the size down too.
    for (const [px, q] of [[1280, 0.6], [1024, 0.5]] as const) {
      if (full.blob.size <= FULL_BUDGET) break;
      full = await toJpeg(bitmap, px, q);
    }
    const thumb = await toJpeg(bitmap, THUMB_MAX, 0.72);
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return {
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      full: new File([full.blob], `${base}.jpg`, { type: "image/jpeg" }),
      thumb: new File([thumb.blob], `${base}-thumb.jpg`, { type: "image/jpeg" }),
      url: URL.createObjectURL(thumb.blob),
      w: full.w,
      h: full.h,
    };
  } finally {
    bitmap.close();
  }
}

/**
 * Photo picker for forms. Resized images are placed into hidden file inputs
 * (`photos`, `photo_thumbs`, `photo_dims`) so they submit with the surrounding form.
 */
export function PhotoInput({ label = "Photos", max = 6, hint }: { label?: string; max?: number; hint?: string }) {
  const [items, setItems] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const fullRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const full = new DataTransfer();
    const thumb = new DataTransfer();
    for (const i of items) { full.items.add(i.full); thumb.items.add(i.thumb); }
    if (fullRef.current) fullRef.current.files = full.files;
    if (thumbRef.current) thumbRef.current.files = thumb.files;
  }, [items]);

  // Free preview URLs when the form goes away (removed items are freed in `removeItem`).
  const live = useRef<Picked[]>([]);
  useEffect(() => { live.current = items; }, [items]);
  useEffect(() => () => live.current.forEach((i) => URL.revokeObjectURL(i.url)), []);
  const removeItem = (key: string) => setItems((s) => {
    s.filter((x) => x.key === key).forEach((x) => URL.revokeObjectURL(x.url));
    return s.filter((x) => x.key !== key);
  });

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - items.length;
    const chosen = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (files.length > room) toast(false, `You can add up to ${max} photos at a time.`);
    setBusy(true);
    const ready: Picked[] = [];
    for (const f of chosen) {
      try { ready.push(await prepare(f)); } catch { toast(false, `Couldn't read ${f.name}.`); }
    }
    setItems((s) => [...s, ...ready]);
    setBusy(false);
  };

  return (
    <div className="sm:col-span-2">
      <span className="label">{label}</span>
      <input ref={fullRef} type="file" name="photos" multiple hidden tabIndex={-1} aria-hidden />
      <input ref={thumbRef} type="file" name="photo_thumbs" multiple hidden tabIndex={-1} aria-hidden />
      <input type="hidden" name="photo_dims" value={JSON.stringify(items.map((i) => [i.w, i.h]))} />
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <div key={i.key} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-surface">
            <img src={i.url} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => removeItem(i.key)}
              className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white" aria-label="Remove photo">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {items.length < max && (
          <label className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong text-muted transition-colors hover:border-primary hover:text-primary ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[10px] font-medium">{busy ? "Preparing" : "Add photo"}</span>
            <input type="file" accept="image/*" multiple className="sr-only" disabled={busy}
              onChange={(e) => { onPick(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <span className="mt-1 block text-[11px] text-subtle">{hint ?? `Up to ${max} photos. On a phone you can take them with the camera.`}</span>
    </div>
  );
}

/** Thumbnails that open a full-screen viewer. Editors can delete from the viewer. */
export function PhotoGallery({ ids, canDelete = false, size = "md", empty }: {
  ids: string[]; canDelete?: boolean; size?: "sm" | "md" | "lg" | "avatar"; empty?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (!ids.length) return empty ? <p className="text-sm text-muted">{empty}</p> : null;
  const box = { sm: "h-9 w-9 rounded-md", md: "h-20 w-20 rounded-lg", lg: "h-28 w-28 rounded-lg", avatar: "h-20 w-20 rounded-full" }[size];
  const shown = size === "sm" ? ids.slice(0, 3) : size === "avatar" ? ids.slice(0, 1) : ids;
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((id, i) => (
          <button key={id} type="button" onClick={() => setOpen(i)} className={`${box} relative overflow-hidden border border-border bg-surface transition-opacity hover:opacity-85`} aria-label={`Open photo ${i + 1}`}>
            <img src={`/api/photos/${id}?size=thumb`} alt="" loading="lazy" className="h-full w-full object-cover" />
            {size === "sm" && i === shown.length - 1 && ids.length > shown.length && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[11px] font-semibold text-white">+{ids.length - shown.length}</span>
            )}
          </button>
        ))}
      </div>
      {open !== null && <Lightbox ids={ids} start={open} canDelete={canDelete} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({ ids, start, canDelete, onClose }: { ids: string[]; start: number; canDelete: boolean; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [deleting, setDeleting] = useState(false);
  const prev = useCallback(() => setI((n) => (n - 1 + ids.length) % ids.length), [ids.length]);
  const next = useCallback(() => setI((n) => (n + 1) % ids.length), [ids.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  const remove = async () => {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    setDeleting(true);
    const res = await deletePhoto(ids[i]);
    setDeleting(false);
    toast(!!res?.ok, res?.ok ? res.message ?? "Deleted." : res?.error ?? "Failed.");
    if (res?.ok) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/90" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="flex items-center justify-between px-4 py-3 text-sm text-white/80">
        <span className="flex items-center gap-2"><Camera className="h-4 w-4" /> {i + 1} / {ids.length}</span>
        <div className="flex items-center gap-1">
          {canDelete && (
            <button type="button" onClick={remove} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-red-300 hover:bg-white/10">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </button>
          )}
          <a href={`/api/photos/${ids[i]}`} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-1.5 hover:bg-white/10">Open original</a>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onClick={onClose}>
        <img src={`/api/photos/${ids[i]}`} alt="" className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        {ids.length > 1 && (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Previous"><ChevronLeft className="h-6 w-6" /></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Next"><ChevronRight className="h-6 w-6" /></button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
