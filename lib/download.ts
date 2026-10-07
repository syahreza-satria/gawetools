import { saveAs as fileSaverSaveAs } from "file-saver";
import { recordHistory } from "@/lib/history";

/** Drop-in replacement for file-saver's saveAs that also logs the download to local history. */
export function saveAs(data: Blob, filename: string): void {
  fileSaverSaveAs(data, filename);
  void recordHistory({ tool: window.location.pathname, filename, size: data.size });
}
