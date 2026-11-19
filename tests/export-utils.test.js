import test from "node:test";
import assert from "node:assert/strict";
import { safeSegment, structureOutputPath, uniquePath } from "../web-engine/export-utils.js";
test("keeps namespaces and ordinary names", function () {
  assert.equal(structureOutputPath("mystructure:house"), "structures/mystructure/house.mcstructure");
});
test("preserves Unicode", function () {
  assert.equal(structureOutputPath("custom:城堡"), "structures/custom/城堡.mcstructure");
});
test("sanitizes traversal", function () {
  assert.equal(structureOutputPath("../evil:../../outside"), "structures/.._evil/_.._outside.mcstructure");
  assert.equal(safeSegment(".."), "unnamed");
});
test("avoids duplicate output paths", function () {
  const used = new Set();
  assert.equal(uniquePath("structures/a/house.mcstructure", used), "structures/a/house.mcstructure");
  assert.equal(uniquePath("structures/a/house.mcstructure", used), "structures/a/house (2).mcstructure");
});
