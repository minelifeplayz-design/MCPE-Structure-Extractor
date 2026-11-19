import test from "node:test";
import assert from "node:assert/strict";
import { extractStructureFilesFromLevelDbKeys } from "mcbe-leveldb-reader";

test("extracts structuretemplate records across namespaces and preserves bytes", async function () {
  const houseBytes = Uint8Array.from([10, 0, 0, 1, 2, 3]);
  const castleBytes = Uint8Array.from([10, 0, 0, 4, 5, 6, 7]);
  const records = new Map([
    ["structuretemplate_mystructure:house", { value: houseBytes }],
    ["structuretemplate_custom:castle", { value: castleBytes }],
    ["levelname", { value: Uint8Array.from([9, 9]) }]
  ]);

  const extracted = extractStructureFilesFromLevelDbKeys(records, false);
  assert.deepEqual(Array.from(extracted.keys()), ["mystructure:house", "custom:castle"]);
  assert.deepEqual(new Uint8Array(await extracted.get("mystructure:house").arrayBuffer()), houseBytes);
  assert.deepEqual(new Uint8Array(await extracted.get("custom:castle").arrayBuffer()), castleBytes);
});
