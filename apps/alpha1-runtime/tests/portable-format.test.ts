import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  PORTABLE_SECTION_ORDER,
  encodePortableBundle,
  parsePortableBundle,
  type PortableSectionRecords
} from "../src/portable-format.js";
import {
  MAX_PORTABLE_EXPORT_BYTES,
  MAX_PORTABLE_EXPORT_LINE_BYTES
} from "../src/config.js";

function sections(): PortableSectionRecords {
  return Object.fromEntries(
    PORTABLE_SECTION_ORDER.map((section) => [section, []])
  ) as unknown as PortableSectionRecords;
}

function minimalSections(): PortableSectionRecords {
  const records = sections();
  records.owners.push({ ownerId: "owner_alpha" });
  records.namespaces.push({
    namespaceId: "ns_alpha",
    ownerId: "owner_alpha",
    createdAt: "2026-07-24T00:00:00.000Z"
  });
  return records;
}

test("portable logical state is deterministic across export metadata changes", () => {
  const first = encodePortableBundle({
    schemaVersion: 4,
    createdAt: "2026-07-24T01:00:00.000Z",
    snapshotCutoff: "2026-07-24T01:00:00.000Z",
    namespaceIds: ["ns_alpha"],
    sections: minimalSections()
  });
  const second = encodePortableBundle({
    schemaVersion: 4,
    createdAt: "2026-07-24T02:00:00.000Z",
    snapshotCutoff: "2026-07-24T02:00:00.000Z",
    namespaceIds: ["ns_alpha"],
    sections: minimalSections()
  });

  assert.equal(first.logicalStateSha256, second.logicalStateSha256);
  assert.notDeepEqual(first.bytes, second.bytes);
  assert.equal(
    first.fileSha256,
    createHash("sha256").update(first.bytes).digest("hex")
  );
  assert.deepEqual(
    parsePortableBundle(first.bytes, first.logicalStateSha256).sections,
    minimalSections()
  );
});

test("portable parser rejects tampering, nested duplicate keys, and secret-shaped fields", () => {
  const bundle = encodePortableBundle({
    schemaVersion: 4,
    createdAt: "2026-07-24T01:00:00.000Z",
    snapshotCutoff: "2026-07-24T01:00:00.000Z",
    namespaceIds: ["ns_alpha"],
    sections: minimalSections()
  });
  assert.throws(
    () => parsePortableBundle(bundle.bytes, "0".repeat(64)),
    /portable_bundle_invalid/u
  );

  const tampered = Buffer.from(
    bundle.bytes
      .toString("utf8")
      .replace('"owner_alpha"', '"owner_bravo"'),
    "utf8"
  );
  assert.throws(
    () => parsePortableBundle(tampered, bundle.logicalStateSha256),
    /portable_bundle_invalid/u
  );

  const lines = bundle.bytes.toString("utf8").trimEnd().split("\n");
  lines[1] =
    '{"kind":"record","record":{"ownerId":"owner_alpha","ownerId":"owner_bravo"},"section":"owners"}';
  assert.throws(
    () =>
      parsePortableBundle(
        Buffer.from(`${lines.join("\n")}\n`, "utf8"),
        bundle.logicalStateSha256
      ),
    /portable_bundle_invalid/u
  );

  const secretLines = bundle.bytes.toString("utf8").trimEnd().split("\n");
  secretLines[1] =
    '{"kind":"record","record":{"ownerId":"owner_alpha","verifier":"forbidden"},"section":"owners"}';
  assert.throws(
    () =>
      parsePortableBundle(
        Buffer.from(`${secretLines.join("\n")}\n`, "utf8"),
        bundle.logicalStateSha256
      ),
    /portable_bundle_invalid/u
  );
});

test("portable encoder refuses records that are not in immutable primary-key order", () => {
  const records = minimalSections();
  records.namespaces.push({
    namespaceId: "ns_aardvark",
    ownerId: "owner_alpha",
    createdAt: "2026-07-24T00:00:00.000Z"
  });

  assert.throws(
    () =>
      encodePortableBundle({
        schemaVersion: 4,
        createdAt: "2026-07-24T01:00:00.000Z",
        snapshotCutoff: "2026-07-24T01:00:00.000Z",
        namespaceIds: ["ns_alpha"],
        sections: records
      }),
    /portable_bundle_invalid/u
  );
});

test("portable parser rejects truncation, trailing data, unknown structure, versions, and bounds", () => {
  const bundle = encodePortableBundle({
    schemaVersion: 4,
    createdAt: "2026-07-24T01:00:00.000Z",
    snapshotCutoff: "2026-07-24T01:00:00.000Z",
    namespaceIds: ["ns_alpha"],
    sections: minimalSections()
  });
  const text = bundle.bytes.toString("utf8");
  const lines = text.trimEnd().split("\n");
  const invalidBundles = [
    bundle.bytes.subarray(0, bundle.bytes.length - 1),
    Buffer.concat([bundle.bytes, Buffer.from("{}\n")]),
    Buffer.from(text.replace('"formatVersion":1', '"formatVersion":2')),
    Buffer.from(
      text.replace('"section":"owners"', '"section":"unknown"')
    ),
    Buffer.from(
      text.replace(
        '{"ownerId":"owner_alpha"}',
        '{"label":"unknown","ownerId":"owner_alpha"}'
      )
    ),
    Buffer.from(
      `${lines[0]}\n{"kind":"record","record":{},"section":"owners"}\n${lines.at(-1)}\n`
    ),
    Buffer.from(`${"a".repeat(MAX_PORTABLE_EXPORT_LINE_BYTES + 1)}\n{}\n`)
  ];
  for (const bytes of invalidBundles) {
    assert.throws(
      () => parsePortableBundle(bytes, bundle.logicalStateSha256),
      /portable_bundle_invalid/u
    );
  }
  assert.throws(
    () =>
      parsePortableBundle(
        Buffer.alloc(MAX_PORTABLE_EXPORT_BYTES + 1, 0x61),
        bundle.logicalStateSha256
      ),
    /portable_bundle_invalid/u
  );
});

test("portable encoder refuses duplicate immutable identifiers", () => {
  const records = minimalSections();
  records.owners.push({ ownerId: "owner_alpha" });
  assert.throws(
    () =>
      encodePortableBundle({
        schemaVersion: 4,
        createdAt: "2026-07-24T01:00:00.000Z",
        snapshotCutoff: "2026-07-24T01:00:00.000Z",
        namespaceIds: ["ns_alpha"],
        sections: records
      }),
    /portable_bundle_invalid/u
  );
});
