import {
  PDFArray,
  PDFCatalog,
  PDFDict,
  PDFDocument,
  PDFName,
  type PDFObject,
  PDFPageLeaf,
  PDFPageTree,
  PDFRef,
  type LoadOptions,
} from "pdf-lib";

// PDFDict keeps its entries in a private map that the PDFCatalog/PDFPageTree/PDFPageLeaf factories need.
const dictOf = (d: PDFDict) => (d as unknown as { dict: Map<PDFName, PDFObject> }).dict;

/**
 * pdf-lib only recognises the catalog, page tree and page objects when they carry
 * /Type /Catalog, /Pages and /Page. Some generators omit those keys, which makes pdf-lib
 * fail with "catalog.Pages is not a function" or silently report 0 pages.
 * This re-wraps those objects so such files can be processed like any other.
 */
function repairPdfStructure(doc: PDFDocument): void {
  const ctx = doc.context;
  const rootRef = ctx.trailerInfo.Root as PDFRef | undefined;
  const root = rootRef ? ctx.lookup(rootRef) : undefined;
  if (!rootRef || !(root instanceof PDFDict)) {
    throw new Error("Struktur PDF tidak valid: katalog dokumen tidak ditemukan.");
  }

  let catalog: PDFDict = root;
  if (!(root instanceof PDFCatalog)) {
    const fixed = PDFCatalog.fromMapWithContext(dictOf(root), ctx);
    fixed.set(PDFName.of("Type"), PDFName.of("Catalog"));
    ctx.assign(rootRef, fixed);
    (doc as unknown as { catalog: PDFCatalog }).catalog = fixed;
    catalog = fixed;
  }

  const visited = new Set<PDFRef>();
  const fixNode = (ref: PDFRef) => {
    if (visited.has(ref)) return;
    visited.add(ref);

    const node = ctx.lookup(ref);
    if (!(node instanceof PDFDict)) return;

    if (node.has(PDFName.of("Kids"))) {
      let tree = node;
      if (!(node instanceof PDFPageTree)) {
        tree = PDFPageTree.fromMapWithContext(dictOf(node), ctx);
        tree.set(PDFName.of("Type"), PDFName.of("Pages"));
        ctx.assign(ref, tree);
      }
      const kids = tree.lookup(PDFName.of("Kids"));
      if (kids instanceof PDFArray) {
        for (let i = 0; i < kids.size(); i++) {
          const kid = kids.get(i);
          if (kid instanceof PDFRef) fixNode(kid);
        }
      }
    } else if (!(node instanceof PDFPageLeaf)) {
      const leaf = PDFPageLeaf.fromMapWithContext(dictOf(node), ctx);
      leaf.set(PDFName.of("Type"), PDFName.of("Page"));
      ctx.assign(ref, leaf);
    }
  };

  const pagesRef = catalog.get(PDFName.of("Pages"));
  if (pagesRef instanceof PDFRef) fixNode(pagesRef);
}

/** Drop-in replacement for PDFDocument.load that also copes with PDFs missing /Type entries. */
export async function loadPdf(data: string | Uint8Array | ArrayBuffer, options?: LoadOptions): Promise<PDFDocument> {
  const doc = await PDFDocument.load(data, options);
  repairPdfStructure(doc);
  return doc;
}
