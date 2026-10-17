// Copies third-party runtimes into public/ so they are served from this site (no CDN):
//  - MediaPipe WASM (Ganti Latar Pas Foto) -> public/mediapipe/wasm
//  - tesseract.js worker + LSTM cores (OCR) -> public/tesseract
// Runs on postinstall; the copied files are git-ignored. Models/traineddata in public/ are committed.
import { cpSync, existsSync, mkdirSync } from "node:fs";

function copyAll(fromDir, toDir, files) {
  if (!existsSync(fromDir)) {
    console.warn("[copy-assets] " + fromDir + " tidak ditemukan, dilewati.");
    return;
  }
  mkdirSync(toDir, { recursive: true });
  for (const f of files) cpSync(fromDir + "/" + f, toDir + "/" + f);
  console.log("[copy-assets] disalin ke " + toDir);
}

copyAll("node_modules/@mediapipe/tasks-vision/wasm", "public/mediapipe/wasm", [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
]);

copyAll("node_modules/tesseract.js/dist", "public/tesseract", ["worker.min.js"]);
copyAll("node_modules/tesseract.js-core", "public/tesseract/core", [
  // tesseract.js v7 loads the "*.wasm.js" builds (WASM embedded in JS), so those are the ones needed.
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-relaxedsimd-lstm.wasm.js",
]);
