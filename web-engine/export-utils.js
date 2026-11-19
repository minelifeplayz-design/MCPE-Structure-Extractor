const INVALID_SEGMENT = /[\\/:*?"<>|]/g;
const CONTROL_CHARS = /[\x00-\x1f]/g;

export function safeSegment(input) {
  let value = String(input ?? "").normalize("NFC");
  value = value.replace(INVALID_SEGMENT, "_").replace(CONTROL_CHARS, "_").trim();
  if (!value || value === "." || value === "..") value = "unnamed";
  return Array.from(value).slice(0, 100).join("");
}

export function structureOutputPath(identifier) {
  const text = String(identifier ?? "");
  const colon = text.indexOf(":");
  const namespace = colon >= 0 ? text.slice(0, colon) : "default";
  const name = colon >= 0 ? text.slice(colon + 1) : text;
  return "structures/" + safeSegment(namespace) + "/" + safeSegment(name) + ".mcstructure";
}

export function uniquePath(path, used) {
  if (!used.has(path)) {
    used.add(path);
    return path;
  }
  const dot = path.lastIndexOf(".");
  const stem = dot >= 0 ? path.slice(0, dot) : path;
  const extension = dot >= 0 ? path.slice(dot) : "";
  let suffix = 2;
  while (used.has(stem + " (" + suffix + ")" + extension)) suffix++;
  const result = stem + " (" + suffix + ")" + extension;
  used.add(result);
  return result;
}
