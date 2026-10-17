"use client";

import { useState } from "react";
import Link from "next/link";
import { PDFCheckBox, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFTextField, type PDFDocument, type PDFField } from "pdf-lib";
import { FormInput, Loader2 } from "lucide-react";
import { loadPdf } from "@/lib/loadPdf";
import { formatBytes } from "@/lib/image";
import {
  ActionBar,
  Card,
  ErrorBanner,
  FileCard,
  FileDropzone,
  ResultCard,
  ToolHeader,
  inputCls,
  primaryBtnCls,
} from "@/components/tool-ui";

type FieldKind = "text" | "checkbox" | "radio" | "dropdown" | "list";
type Value = string | boolean | string[];

interface FieldInfo {
  name: string;
  kind: FieldKind;
  page: number; // 1-based, 0 = unknown
  options: string[];
  multiline: boolean;
  initial: Value;
}

function pageOf(doc: PDFDocument, field: PDFField): number {
  const widget = field.acroField.getWidgets()[0];
  const ref = widget?.P();
  if (!ref) return 0;
  const idx = doc.getPages().findIndex((p) => p.ref === ref);
  return idx >= 0 ? idx + 1 : 0;
}

function readFields(doc: PDFDocument): FieldInfo[] {
  const out: FieldInfo[] = [];
  for (const field of doc.getForm().getFields()) {
    const name = field.getName();
    const page = pageOf(doc, field);
    if (field instanceof PDFTextField) {
      out.push({ name, kind: "text", page, options: [], multiline: field.isMultiline(), initial: field.getText() ?? "" });
    } else if (field instanceof PDFCheckBox) {
      out.push({ name, kind: "checkbox", page, options: [], multiline: false, initial: field.isChecked() });
    } else if (field instanceof PDFRadioGroup) {
      out.push({ name, kind: "radio", page, options: field.getOptions(), multiline: false, initial: field.getSelected() ?? "" });
    } else if (field instanceof PDFDropdown) {
      out.push({ name, kind: "dropdown", page, options: field.getOptions(), multiline: false, initial: field.getSelected()[0] ?? "" });
    } else if (field instanceof PDFOptionList) {
      out.push({ name, kind: "list", page, options: field.getOptions(), multiline: false, initial: field.getSelected() });
    }
  }
  return out;
}

export default function FillPdfFormPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FieldInfo[] | null>(null);
  const [values, setValues] = useState<Record<string, Value>>({});
  const [flatten, setFlatten] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  const reset = () => {
    setFile(null);
    setFields(null);
    setValues({});
    setResult(null);
    setError(null);
  };

  const handleFiles = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    setIsLoading(true);
    setError(null);
    try {
      const doc = await loadPdf(await picked.arrayBuffer());
      const list = readFields(doc);
      setFile(picked);
      setFields(list);
      setValues(Object.fromEntries(list.map((f) => [f.name, f.initial])));
    } catch (err) {
      console.error(err);
      setError("Gagal membaca PDF. File mungkin rusak atau terkunci password.");
    } finally {
      setIsLoading(false);
    }
  };

  const setValue = (name: string, value: Value) => setValues((prev) => ({ ...prev, [name]: value }));

  const apply = async () => {
    if (!file || !fields) return;
    setIsWorking(true);
    setError(null);
    try {
      const doc = await loadPdf(await file.arrayBuffer());
      const form = doc.getForm();
      for (const info of fields) {
        const field = form.getField(info.name);
        const v = values[info.name];
        if (field instanceof PDFTextField) field.setText(typeof v === "string" && v !== "" ? v : undefined);
        else if (field instanceof PDFCheckBox) {
          if (v) field.check();
          else field.uncheck();
        }
        else if (field instanceof PDFRadioGroup) {
          if (typeof v === "string" && v) field.select(v);
          else field.clear();
        } else if (field instanceof PDFDropdown) {
          if (typeof v === "string" && v) field.select(v);
          else field.clear();
        } else if (field instanceof PDFOptionList) {
          if (Array.isArray(v) && v.length > 0) field.select(v);
          else field.clear();
        }
      }
      if (flatten) form.flatten();
      const bytes = await doc.save();
      setResult(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
    } catch (err) {
      console.error(err);
      const detail = err instanceof Error ? err.message : String(err);
      setError("Gagal mengisi formulir: " + detail + ". Karakter di luar huruf Latin dasar kadang tidak didukung oleh font formulir.");
    } finally {
      setIsWorking(false);
    }
  };

  const grouped = fields
    ? Array.from(
        fields.reduce((map, f) => {
          const list = map.get(f.page) ?? [];
          list.push(f);
          map.set(f.page, list);
          return map;
        }, new Map<number, FieldInfo[]>())
      ).sort((a, b) => (a[0] || 9999) - (b[0] || 9999))
    : [];

  const outName = file ? file.name.replace(/\.[^/.]+$/, "") + "_terisi.pdf" : "terisi.pdf";

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <ToolHeader
        icon={<FormInput className="w-6 h-6" />}
        title="Isi Formulir PDF"
        description="Isi kolom formulir PDF (teks, centang, pilihan) langsung di browser, lalu simpan atau ratakan agar tidak bisa diedit."
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {result && (
        <ResultCard
          title="Formulir Berhasil Diisi!"
          subtitle={formatBytes(result.size) + (flatten ? " · sudah diratakan" : "")}
          blob={result}
          filename={outName}
          onBack={() => setResult(null)}
          backLabel="Ubah Isian"
          onReset={reset}
        />
      )}

      {!file && <FileDropzone kind="pdf" icon={<FormInput className="w-7 h-7" />} onFiles={handleFiles} loading={isLoading} />}

      {file && fields && !result && (
        <div className="space-y-6">
          <FileCard name={file.name} meta={formatBytes(file.size) + " · " + fields.length + " kolom"} onRemove={reset} disabled={isWorking} />

          {fields.length === 0 ? (
            <Card className="text-sm text-zinc-300 space-y-3">
              <p>PDF ini tidak punya kolom formulir yang bisa diisi.</p>
              <p className="text-zinc-400">
                Untuk menambahkan teks atau tanda tangan ke dokumen biasa, coba{" "}
                <Link href="/sign-pdf" className="text-white underline underline-offset-2">
                  Tanda Tangan PDF
                </Link>{" "}
                atau{" "}
                <Link href="/watermark-pdf" className="text-white underline underline-offset-2">
                  Watermark PDF
                </Link>
                .
              </p>
            </Card>
          ) : (
            <>
              {grouped.map(([page, list]) => (
                <Card key={page} className="space-y-4">
                  <h3 className="label-mono text-zinc-300">{page ? "Halaman " + page : "Kolom lainnya"}</h3>
                  {list.map((f) => (
                    <div key={f.name}>
                      {f.kind === "checkbox" ? (
                        <label className="flex items-center gap-2.5 text-sm text-zinc-200">
                          <input
                            type="checkbox"
                            checked={values[f.name] === true}
                            onChange={(e) => setValue(f.name, e.target.checked)}
                            className="accent-sky-600 w-4 h-4"
                          />
                          {f.name}
                        </label>
                      ) : (
                        <>
                          <label className="block text-sm font-semibold text-zinc-200 mb-1.5">{f.name}</label>
                          {f.kind === "text" &&
                            (f.multiline ? (
                              <textarea
                                rows={3}
                                value={(values[f.name] as string) ?? ""}
                                onChange={(e) => setValue(f.name, e.target.value)}
                                className={inputCls}
                              />
                            ) : (
                              <input
                                type="text"
                                value={(values[f.name] as string) ?? ""}
                                onChange={(e) => setValue(f.name, e.target.value)}
                                className={inputCls}
                              />
                            ))}
                          {f.kind === "dropdown" && (
                            <select
                              value={(values[f.name] as string) ?? ""}
                              onChange={(e) => setValue(f.name, e.target.value)}
                              className={inputCls}
                            >
                              <option value="">(kosong)</option>
                              {f.options.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          )}
                          {f.kind === "radio" && (
                            <div className="flex flex-wrap gap-x-5 gap-y-2">
                              {f.options.map((o) => (
                                <label key={o} className="flex items-center gap-2 text-sm text-zinc-200">
                                  <input
                                    type="radio"
                                    name={"radio-" + f.name}
                                    checked={values[f.name] === o}
                                    onChange={() => setValue(f.name, o)}
                                    className="accent-sky-600"
                                  />
                                  {o}
                                </label>
                              ))}
                            </div>
                          )}
                          {f.kind === "list" && (
                            <select
                              multiple
                              value={(values[f.name] as string[]) ?? []}
                              onChange={(e) => setValue(f.name, Array.from(e.target.selectedOptions, (o) => o.value))}
                              className={inputCls}
                            >
                              {f.options.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </Card>
              ))}

              <Card>
                <label className="flex items-start gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} className="accent-sky-600 mt-1" />
                  <span>
                    Ratakan formulir
                    <span className="block text-xs text-zinc-400">Isian menjadi bagian dari halaman sehingga tidak bisa diedit lagi.</span>
                  </span>
                </label>
              </Card>

              <ActionBar>
                <button type="button" onClick={apply} disabled={isWorking} className={primaryBtnCls}>
                  {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <FormInput className="w-4 h-4" />}
                  <span>Simpan Formulir</span>
                </button>
              </ActionBar>
            </>
          )}
        </div>
      )}
    </div>
  );
}
