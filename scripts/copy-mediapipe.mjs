// Copies the MediaPipe WASM runtime into public/ so it is served from this site (no third-party CDN).
// Runs on postinstall; the copied files are git-ignored (the tflite model in public/models is committed).
import { cpSync, existsSync, mkdirSync } from "node:fs";

const from = "node_modules/@mediapipe/tasks-vision/wasm";
const to = "public/mediapipe/wasm";
const files = ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"];

if (!existsSync(from)) {
  console.warn("[copy-mediapipe] @mediapipe/tasks-vision tidak ditemukan, dilewati.");
  process.exit(0);
}
mkdirSync(to, { recursive: true });
for (const f of files) cpSync(from + "/" + f, to + "/" + f);
console.log("[copy-mediapipe] disalin ke " + to);
