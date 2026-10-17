"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { ArrowDownToLine, Camera, Check, Copy, ExternalLink, ImagePlus, QrCode, TriangleAlert, X } from "lucide-react";
import { saveAs } from "@/lib/download";
import { canvasToBlob } from "@/lib/image";
import { Card, ErrorBanner, SegmentedButtons, ToolHeader, inputCls, primaryBtnCls, secondaryBtnCls } from "@/components/tool-ui";

type Tab = "create" | "scan";
type Kind = "text" | "wifi" | "contact";

// BarcodeDetector is not in TypeScript's DOM lib yet.
interface DetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats: string[] }) => DetectorLike;
  }
}

const escapeWifi = (v: string) => v.replace(/([\\;,:"])/g, "\\$1");

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ---------------------------------------------------------------- create

function CreatePanel() {
  const [kind, setKind] = useState<Kind>("text");
  const [text, setText] = useState("");
  const [wifi, setWifi] = useState({ ssid: "", password: "", security: "WPA" as "WPA" | "WEP" | "nopass", hidden: false });
  const [contact, setContact] = useState({ name: "", phone: "", email: "", org: "", url: "" });
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [logo, setLogo] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const payload =
    kind === "text"
      ? text
      : kind === "wifi"
        ? wifi.ssid
          ? "WIFI:T:" + wifi.security + ";S:" + escapeWifi(wifi.ssid) + ";P:" + escapeWifi(wifi.security === "nopass" ? "" : wifi.password) + ";H:" + wifi.hidden + ";;"
          : ""
        : contact.name || contact.phone || contact.email
          ? [
              "BEGIN:VCARD",
              "VERSION:3.0",
              "N:" + contact.name + ";;;;",
              "FN:" + contact.name,
              contact.org && "ORG:" + contact.org,
              contact.phone && "TEL:" + contact.phone,
              contact.email && "EMAIL:" + contact.email,
              contact.url && "URL:" + contact.url,
              "END:VCARD",
            ]
              .filter(Boolean)
              .join("\n")
          : "";

  const ecc = logo ? "H" : "M";
  const lowContrast = contrastRatio(fg, bg) < 3;

  // Draw QR (+ logo) whenever anything changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    QRCode.toCanvas(canvas, payload, { width: size, margin, errorCorrectionLevel: ecc, color: { dark: fg, light: bg } })
      .then(() => {
        if (!logo) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const box = canvas.width * 0.22;
        const x = (canvas.width - box) / 2;
        ctx.fillStyle = bg;
        ctx.fillRect(x - 4, x - 4, box + 8, box + 8);
        const ratio = Math.min(box / logo.img.width, box / logo.img.height);
        const w = logo.img.width * ratio;
        const h = logo.img.height * ratio;
        ctx.drawImage(logo.img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      })
      .catch(() => setError("Teks terlalu panjang untuk dijadikan QR code. Persingkat isinya."));
  }, [payload, size, margin, fg, bg, logo, ecc]);

  useEffect(() => {
    return () => {
      if (logo) URL.revokeObjectURL(logo.url);
    };
  }, [logo]);

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setLogo({ url, img });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Gagal membaca gambar logo.");
    };
    img.src = url;
  };

  const downloadPng = async () => {
    if (canvasRef.current) saveAs(await canvasToBlob(canvasRef.current, "image/png"), "qr-code.png");
  };

  const downloadSvg = async () => {
    let svg = await QRCode.toString(payload, { type: "svg", width: size, margin, errorCorrectionLevel: ecc, color: { dark: fg, light: bg } });
    if (logo) {
      const vb = /viewBox="0 0 (\d+) \d+"/.exec(svg);
      const units = vb ? Number(vb[1]) : 29;
      const box = units * 0.22;
      const dataUrl = await new Promise<string>((resolve) => {
        const c = document.createElement("canvas");
        c.width = logo.img.width;
        c.height = logo.img.height;
        c.getContext("2d")?.drawImage(logo.img, 0, 0);
        resolve(c.toDataURL("image/png"));
      });
      const x = (units - box) / 2;
      svg = svg.replace(
        "</svg>",
        '<rect x="' + (x - 0.3) + '" y="' + (x - 0.3) + '" width="' + (box + 0.6) + '" height="' + (box + 0.6) + '" fill="' + bg + '"/>' +
          '<image href="' + dataUrl + '" x="' + x + '" y="' + x + '" width="' + box + '" height="' + box + '" preserveAspectRatio="xMidYMid meet"/></svg>'
      );
    }
    saveAs(new Blob([svg], { type: "image/svg+xml" }), "qr-code.svg");
  };

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} onClose={() => setError(null)} />
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6">
        <Card className="space-y-5">
          <SegmentedButtons
            value={kind}
            onChange={setKind}
            options={[
              { id: "text", label: "Teks / URL" },
              { id: "wifi", label: "WiFi" },
              { id: "contact", label: "Kontak" },
            ]}
          />

          {kind === "text" && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Tempel tautan atau tulis teks, mis. https://gawetools.vercel.app"
              className={inputCls}
            />
          )}

          {kind === "wifi" && (
            <div className="space-y-3">
              <input type="text" value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} placeholder="Nama WiFi (SSID)" className={inputCls} />
              <select value={wifi.security} onChange={(e) => setWifi({ ...wifi, security: e.target.value as typeof wifi.security })} className={inputCls}>
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Tanpa kata sandi</option>
              </select>
              {wifi.security !== "nopass" && (
                <input type="text" value={wifi.password} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} placeholder="Kata sandi" className={inputCls} />
              )}
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={wifi.hidden} onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })} className="accent-sky-600" />
                Jaringan tersembunyi
              </label>
            </div>
          )}

          {kind === "contact" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Nama lengkap" className={inputCls} />
              <input type="text" value={contact.org} onChange={(e) => setContact({ ...contact, org: e.target.value })} placeholder="Perusahaan (opsional)" className={inputCls} />
              <input type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="Nomor telepon" className={inputCls} />
              <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="Email" className={inputCls} />
              <input type="url" value={contact.url} onChange={(e) => setContact({ ...contact, url: e.target.value })} placeholder="Situs web (opsional)" className={inputCls + " sm:col-span-2"} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="flex justify-between text-sm font-semibold text-white mb-1.5">
                <span>Ukuran</span>
                <span className="text-zinc-400">{size} px</span>
              </label>
              <input type="range" min={200} max={1024} step={8} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-semibold text-white mb-1.5">
                <span>Margin</span>
                <span className="text-zinc-400">{margin} modul</span>
              </label>
              <input type="range" min={0} max={8} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full" />
            </div>
            <label className="flex items-center gap-3 text-sm text-zinc-200">
              Warna QR
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-10 h-9 rounded bg-transparent border border-zinc-600 cursor-pointer" />
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-200">
              Latar
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-10 h-9 rounded bg-transparent border border-zinc-600 cursor-pointer" />
            </label>
          </div>

          {lowContrast && (
            <p className="flex items-start gap-2 text-xs text-amber-300">
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              Kontras warna rendah; QR code mungkin sulit dipindai. Gunakan QR yang jauh lebih gelap dari latarnya.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <label className={secondaryBtnCls + " !py-2.5 cursor-pointer"}>
              <ImagePlus className="w-4 h-4" />
              {logo ? "Ganti logo" : "Tambah logo di tengah"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={(e) => {
                  pickLogo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {logo && (
              <button type="button" onClick={() => setLogo(null)} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                <X className="w-3.5 h-3.5" /> Hapus logo
              </button>
            )}
            {logo && <span className="text-xs text-zinc-400">Koreksi kesalahan diatur ke level H.</span>}
          </div>
        </Card>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl border border-zinc-700 p-3 bg-zinc-900 min-w-56 min-h-56 flex items-center justify-center">
            {payload ? (
              <canvas ref={canvasRef} className="max-w-[16rem] w-full h-auto rounded" style={{ imageRendering: "pixelated" }} aria-label="QR code" />
            ) : (
              <p className="text-xs text-zinc-400 text-center px-6">Isi data di samping untuk melihat QR code.</p>
            )}
          </div>
          {payload && (
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={downloadPng} className={primaryBtnCls}>
                <ArrowDownToLine className="w-4 h-4" />
                PNG
              </button>
              <button type="button" onClick={downloadSvg} className={secondaryBtnCls + " !py-2.5"}>
                <ArrowDownToLine className="w-4 h-4" />
                SVG
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- scan

function ScanPanel() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const decodeCanvas = async (canvas: HTMLCanvasElement): Promise<string | null> => {
    if (window.BarcodeDetector) {
      try {
        const found = await new window.BarcodeDetector({ formats: ["qr_code"] }).detect(canvas);
        if (found[0]) return found[0].rawValue;
      } catch {
        /* fall through to jsQR */
      }
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height)?.data ?? null;
  };

  const startCamera = async () => {
    setError(null);
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Browser ini tidak mendukung kamera. Unggah gambar QR code sebagai gantinya.");
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      setCameraOn(true);
    } catch {
      setError("Kamera tidak bisa diakses. Izinkan akses kamera di browser, atau unggah gambar QR code.");
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!cameraOn || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {});

    const canvas = document.createElement("canvas");
    let busy = false;
    let last = 0;
    const tick = async (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (busy || now - last < 180 || video.videoWidth === 0) return;
      busy = true;
      last = now;
      const scale = Math.min(1, 720 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext("2d", { willReadFrequently: true })?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const value = await decodeCanvas(canvas);
      busy = false;
      if (value) {
        setResult(value);
        stopCamera();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraOn, stopCamera]);

  const scanImage = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d", { willReadFrequently: true })?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const value = await decodeCanvas(canvas);
      if (value) setResult(value);
      else setError("QR code tidak ditemukan di gambar ini. Coba foto yang lebih dekat dan tajam.");
    } catch {
      setError("Gagal membaca gambar.");
    }
  };

  const isUrl = result !== null && /^https?:\/\//i.test(result.trim());

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} onClose={() => setError(null)} />
      <Card className="space-y-4">
        {cameraOn && (
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video ref={videoRef} playsInline muted className="w-full max-h-[60vh] object-contain" />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => (cameraOn ? stopCamera() : void startCamera())} className={primaryBtnCls}>
            {cameraOn ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {cameraOn ? "Matikan Kamera" : "Pindai dengan Kamera"}
          </button>
          <label className={secondaryBtnCls + " !py-2.5 cursor-pointer"}>
            <ImagePlus className="w-4 h-4" />
            Unggah Gambar QR
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                void scanImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-xs text-zinc-400">Gambar dan video kamera diproses di perangkat Anda dan tidak dikirim ke mana pun.</p>
      </Card>

      {result !== null && (
        <Card className="space-y-3">
          <h3 className="label-mono text-zinc-300">Hasil pindai</h3>
          <textarea readOnly value={result} rows={Math.min(Math.max(result.split("\n").length, 2), 10)} className={inputCls + " font-mono"} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  setError("Gagal menyalin ke clipboard.");
                }
              }}
              className={primaryBtnCls}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Salin
            </button>
            {isUrl && (
              <a href={result.trim()} target="_blank" rel="noopener noreferrer" className={secondaryBtnCls + " !py-2.5"}>
                <ExternalLink className="w-4 h-4" />
                Buka tautan
              </a>
            )}
          </div>
          {isUrl && <p className="text-xs text-zinc-400">Periksa alamat tautan sebelum membukanya; QR code bisa mengarah ke situs berbahaya.</p>}
        </Card>
      )}
    </div>
  );
}

export default function QrCodePage() {
  const [tab, setTab] = useState<Tab>("create");

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <ToolHeader
        icon={<QrCode className="w-6 h-6" />}
        title="QR Code"
        description="Buat QR code untuk tautan, WiFi, atau kontak, dan pindai QR code dari kamera atau gambar. Semua berjalan di browser Anda."
      />
      <div className="mb-6">
        <SegmentedButtons
          value={tab}
          onChange={setTab}
          options={[
            { id: "create", label: "Buat QR Code" },
            { id: "scan", label: "Pindai QR Code" },
          ]}
        />
      </div>
      {tab === "create" ? <CreatePanel /> : <ScanPanel />}
    </div>
  );
}
