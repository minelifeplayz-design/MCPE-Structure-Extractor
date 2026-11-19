import { extractStructureFilesFromMcworld } from "mcbe-leveldb-reader";
import { strToU8, zipSync } from "fflate";
import { structureOutputPath, uniquePath, safeSegment } from "./export-utils.js";
let currentStructures = new Map();
let currentWorldName = "";
export async function scanWorld(file) {
  if (!file) throw new Error("Choose a world file first.");
  if (!String(file.name || "").toLowerCase().endsWith(".mcworld")) throw new Error("This version accepts .mcworld files only.");
  if (file.size === 0) throw new Error("The selected world file is empty.");
  currentWorldName = file.name;
  currentStructures = await extractStructureFilesFromMcworld(file, false);
  return Array.from(currentStructures.entries()).map(function (entry) {
    return { identifier: entry[0], fileName: entry[1].name, size: entry[1].size };
  }).sort(function (a, b) { return a.identifier.localeCompare(b.identifier); });
}
export function getWorldName() { return currentWorldName; }
export async function prepareExport(identifiers) {
  const selected = Array.from(new Set(identifiers || [])).filter(function (id) { return currentStructures.has(id); });
  if (selected.length === 0) throw new Error("Select at least one structure.");
  if (selected.length === 1) {
    const id = selected[0];
    const file = currentStructures.get(id);
    return {
      fileName: safeSegment(id.replace(":", "_")) + ".mcstructure",
      mimeType: "application/octet-stream",
      bytes: new Uint8Array(await file.arrayBuffer())
    };
  }
  const entries = {};
  const manifest = { application: "MCPE Structure Extractor", sourceWorld: currentWorldName, exportedAt: new Date().toISOString(), structures: [] };
  const usedPaths = new Set();
  for (const id of selected) {
    const file = currentStructures.get(id);
    const path = uniquePath(structureOutputPath(id), usedPaths);
    const bytes = new Uint8Array(await file.arrayBuffer());
    entries[path] = bytes;
    manifest.structures.push({ identifier: id, path: path, sizeBytes: bytes.byteLength });
  }
  entries["extraction_manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
  return { fileName: "MCPE-Extracted-Structures.zip", mimeType: "application/zip", bytes: zipSync(entries, { level: 0 }) };
}
