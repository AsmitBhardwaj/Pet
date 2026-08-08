"use client";

// Customizer — Phase 2 flow: upload -> crop -> extract -> live preview -> export.
//
// Scope (see the Phase 2 brief / root CLAUDE.md): species and shape are
// hardcoded to a single dog shape. The real species/shape picker gallery is
// Phase 3 and intentionally NOT built here — the goal is one working shape,
// end to end. Everything is client-side; no image or data leaves the browser.
//
// The exported JSON must satisfy apps/dodo's import validator
// (renderer/dog.js isValidConfig): a non-empty `species` string and a `coat`
// object with string `base`/`light`/`shade`. `version` and `shape` ride along.

import { useCallback, useState } from "react";
import PhotoCropper from "./PhotoCropper";
import SpritePreview from "./SpritePreview";
import { coatFromCrop } from "../lib/extract";

const CONFIG_VERSION = 1;
const SPECIES = "dog";
// sprite-core has no formal shape registry yet (that's Phase 3), and its single
// dog grid (BASE_DOG) is the floppy-eared retriever build. Until the picker and
// real shape ids exist, this is the agreed placeholder id for that one shape.
// The app carries `shape` through but doesn't render off it yet, so any stable
// string is safe here.
const SHAPE = "retriever";

const SWATCHES = [
  { key: "light", label: "Light" },
  { key: "base", label: "Base" },
  { key: "shade", label: "Shade" },
];

export default function Customizer() {
  const [coat, setCoat] = useState(null); // { base, light, shade } | null

  // PhotoCropper hands us the <img> + confirmed crop; sprite-core does the
  // color math. Wrapped in useCallback so the cropper's throttle is stable.
  const handleCropChange = useCallback((img, crop) => {
    setCoat(coatFromCrop(img, crop));
  }, []);

  const handleReset = useCallback(() => setCoat(null), []);

  function downloadConfig() {
    if (!coat) return;
    const config = {
      version: CONFIG_VERSION,
      species: SPECIES,
      shape: SHAPE,
      coat: { base: coat.base, light: coat.light, shade: coat.shade },
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dodo-pet-config.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {/* Left: upload + crop */}
      <div>
        <h3 className="font-pixel text-[12px] leading-[1.6]">
          1 — Upload &amp; crop
        </h3>
        <p className="mt-3 mb-6 text-sm text-muted">
          Drop in a photo and frame your pet&apos;s fur. We read the dominant
          color right here in your browser.
        </p>
        <PhotoCropper onCropChange={handleCropChange} onReset={handleReset} />
      </div>

      {/* Right: live preview + palette + download */}
      <div>
        <h3 className="font-pixel text-[12px] leading-[1.6]">
          2 — Preview &amp; download
        </h3>
        <p className="mt-3 mb-6 text-sm text-muted">
          This is exactly how your pet will look in the app. Happy with it?
          Download the config and import it on first launch.
        </p>

        <div className="pixel-monitor">
          <div className="pixel-screen flex items-center justify-center">
            {coat ? (
              <SpritePreview coat={coat} className="w-40" />
            ) : (
              <p className="py-10 text-center font-pixel text-[9px] leading-[1.8] text-muted">
                Your preview
                <br />
                appears here
              </p>
            )}
          </div>

          {/* Extracted palette — the one place color is allowed. */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {SWATCHES.map((s) => (
              <span
                key={s.key}
                title={coat ? `${s.label} ${coat[s.key]}` : s.label}
                className="h-5 w-5 border-2 border-border"
                style={{ background: coat ? coat[s.key] : "transparent" }}
              />
            ))}
          </div>
          <p className="mt-3 text-center font-pixel text-[8px] uppercase text-muted">
            {coat ? "Extracted palette" : "Awaiting photo"}
          </p>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={downloadConfig}
            disabled={!coat}
            className="btn-pixel btn-primary disabled:opacity-40"
            style={coat ? undefined : { cursor: "not-allowed" }}
          >
            Download pet config
          </button>
          {coat && (
            <p className="mt-3 font-mono text-xs text-muted">
              {coat.base} · dog · retriever
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
