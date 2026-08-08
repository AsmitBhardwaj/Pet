"use client";

// PhotoCropper — the upload + crop step of the customizer.
//
// Upload: drag-and-drop OR click to choose (image files only). The chosen file
// is read entirely in-browser via an object URL; it is never uploaded anywhere.
//
// Crop: there is NO subject detection by design (see CLAUDE.md — no ML/AI). The
// user positions a square over the part of their photo that is actually fur, so
// color extraction samples that region and not the background/floor/grass. The
// square can be dragged (move) and resized from its bottom-right corner (stays
// square). Crop geometry is tracked in NATURAL image pixels so it's independent
// of however large the image happens to render.
//
// This component does no color work: whenever the image or crop changes it
// reports (imgElement, cropRect) upward and the parent asks sprite-core for the
// coat. Crop rect shape: { sx, sy, size } in natural pixels.

import { useCallback, useEffect, useRef, useState } from "react";
import PixelIcon from "./PixelIcon";

const ACCEPT = "image/*";

export default function PhotoCropper({ onCropChange, onReset }) {
  const [src, setSrc] = useState(null); // object URL of the chosen image
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [natural, setNatural] = useState(null); // { w, h }
  const [crop, setCrop] = useState(null); // { sx, sy, size } in natural px
  const [scale, setScale] = useState(1); // displayed px per natural px

  const imgRef = useRef(null);
  const frameRef = useRef(null);
  const inputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const rafRef = useRef(0);
  // Active pointer gesture: { mode: 'move'|'resize', startX, startY, orig }.
  const gesture = useRef(null);

  // Revoke the object URL when it changes or on unmount (no leaks).
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Report a crop upward, throttled to one call per animation frame so a fast
  // drag doesn't fire dozens of extractions per second.
  const report = useCallback(
    (nextCrop) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (imgRef.current && nextCrop) onCropChange(imgRef.current, nextCrop);
      });
    },
    [onCropChange]
  );

  function acceptFile(file) {
    setError(null);
    if (!file || !file.type.startsWith("image/")) {
      setError("That's not an image. Please choose a JPG or PNG.");
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSrc(url);
    setNatural(null);
    setCrop(null);
  }

  function onFileInput(e) {
    const file = e.target.files && e.target.files[0];
    acceptFile(file);
    e.target.value = ""; // allow re-picking the same file
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    acceptFile(file);
  }

  // Measure how large the image is actually rendered, so overlay math (natural
  // <-> displayed) stays correct across responsive/window-resize changes.
  const measure = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    setScale(img.getBoundingClientRect().width / img.naturalWidth);
  }, []);

  function onImgLoad() {
    const img = imgRef.current;
    // Some browsers can't decode HEIC to a canvas-usable image; naturalWidth 0
    // is the tell. Fail gracefully rather than silently extracting nothing.
    if (!img || !img.naturalWidth) {
      setError("Couldn't read that image. Try a JPG or PNG export instead.");
      setSrc(null);
      return;
    }
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });
    // Start with a centered square at 60% of the shorter side.
    const size = Math.round(Math.min(w, h) * 0.6);
    const initial = {
      sx: Math.round((w - size) / 2),
      sy: Math.round((h - size) / 2),
      size,
    };
    setCrop(initial);
    measure();
    report(initial);
  }

  // Keep the displayed-scale factor in sync with layout changes.
  useEffect(() => {
    if (!src) return;
    measure();
    const ro = new ResizeObserver(measure);
    if (imgRef.current) ro.observe(imgRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [src, measure]);

  const minSize = natural ? Math.max(16, Math.round(Math.min(natural.w, natural.h) * 0.1)) : 16;

  function clampCrop(next) {
    if (!natural) return next;
    const size = Math.max(minSize, Math.min(next.size, natural.w, natural.h));
    const sx = Math.max(0, Math.min(next.sx, natural.w - size));
    const sy = Math.max(0, Math.min(next.sy, natural.h - size));
    return { sx, sy, size };
  }

  function beginGesture(mode, e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: crop,
    };
  }

  function onPointerMove(e) {
    const g = gesture.current;
    if (!g || !natural) return;
    // Convert the pointer delta from displayed px to natural px.
    const dx = (e.clientX - g.startX) / scale;
    const dy = (e.clientY - g.startY) / scale;
    let next;
    if (g.mode === "move") {
      next = clampCrop({ sx: g.orig.sx + dx, sy: g.orig.sy + dy, size: g.orig.size });
    } else {
      // Resize from the bottom-right corner; keep it square using the larger
      // of the two axis deltas, capped so it can't run off the image edge.
      const maxSize = Math.min(natural.w - g.orig.sx, natural.h - g.orig.sy);
      const delta = Math.max(dx, dy);
      const size = Math.max(minSize, Math.min(g.orig.size + delta, maxSize));
      next = { sx: g.orig.sx, sy: g.orig.sy, size };
    }
    setCrop(next);
    report(next);
  }

  function endGesture(e) {
    if (!gesture.current) return;
    gesture.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    if (crop) report(crop);
  }

  function reset() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setSrc(null);
    setNatural(null);
    setCrop(null);
    setError(null);
    if (onReset) onReset();
  }

  // --- Empty state: the dropzone ---
  if (!src) {
    return (
      <div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current && inputRef.current.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`card-pixel flex flex-col items-center justify-center gap-4 px-6 py-16 text-center transition-colors ${
            dragOver ? "bg-[#161616]" : ""
          }`}
        >
          <PixelIcon name="camera" className="h-10 w-10 text-foreground" />
          <p className="font-pixel text-[11px] leading-[1.6]">
            Drop a pet photo
          </p>
          <p className="max-w-xs text-sm text-muted">
            Or click to choose a file. JPG or PNG. Your photo stays on your
            device — nothing is uploaded.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onFileInput}
          className="hidden"
        />
        {error && <p className="mt-3 text-sm text-muted">{error}</p>}
      </div>
    );
  }

  // --- Loaded state: image + draggable/resizable square crop ---
  const boxStyle = crop
    ? {
        left: crop.sx * scale,
        top: crop.sy * scale,
        width: crop.size * scale,
        height: crop.size * scale,
      }
    : { display: "none" };

  return (
    <div>
      <div
        ref={frameRef}
        className="relative inline-block max-w-full select-none border-2 border-border align-top"
        style={{ lineHeight: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt="Your uploaded pet"
          onLoad={onImgLoad}
          draggable={false}
          className="block max-h-[420px] w-auto max-w-full"
        />

        {/* Dimmed mask outside the crop is skipped for simplicity — the bright
            square border is enough to read as "sampling here". */}
        <div
          onPointerDown={(e) => beginGesture("move", e)}
          onPointerMove={onPointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          className="absolute box-border border-2 border-white"
          style={{
            ...boxStyle,
            cursor: "move",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
          }}
        >
          {/* corner ticks for a viewfinder look */}
          <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-white" />
          <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-white" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-white" />
          {/* resize handle (bottom-right) */}
          <span
            onPointerDown={(e) => beginGesture("resize", e)}
            onPointerMove={onPointerMove}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 border-2 border-white bg-black"
            style={{ cursor: "nwse-resize" }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" onClick={reset} className="btn-pixel btn-secondary">
          Change photo
        </button>
        <p className="text-sm text-muted">
          Drag the square onto your pet&apos;s fur; resize from the corner.
        </p>
      </div>
      {error && <p className="mt-3 text-sm text-muted">{error}</p>}
    </div>
  );
}
