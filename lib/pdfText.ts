import type { PDFDocumentProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

/** Extracts readable text from one page, rebuilding lines from the y position of each text run. */
export async function extractPageText(pdf: PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  const items = content.items.filter((i): i is TextItem => "str" in i && i.str.length > 0);

  type Run = { x: number; y: number; w: number; h: number; str: string };
  const runs: Run[] = items.map((i) => ({ x: i.transform[4], y: i.transform[5], w: i.width, h: i.height || Math.abs(i.transform[3]) || 10, str: i.str }));
  runs.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: Run[][] = [];
  for (const run of runs) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line[0].y - run.y) <= Math.max(2, run.h * 0.4)) line.push(run);
    else lines.push([run]);
  }

  return lines
    .map((line) => {
      line.sort((a, b) => a.x - b.x);
      let text = "";
      let prevEnd = 0;
      line.forEach((run, idx) => {
        if (idx > 0) {
          const gap = run.x - prevEnd;
          if (gap > run.h * 0.2 && !text.endsWith(" ") && !run.str.startsWith(" ")) text += " ";
        }
        text += run.str;
        prevEnd = run.x + run.w;
      });
      return text.trimEnd();
    })
    .join("\n");
}
