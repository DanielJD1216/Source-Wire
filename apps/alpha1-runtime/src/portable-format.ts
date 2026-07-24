import { createHash } from "node:crypto";
import { TextDecoder } from "node:util";

import {
  MAX_PORTABLE_EXPORT_BYTES,
  MAX_PORTABLE_EXPORT_LINE_BYTES,
  MAX_PORTABLE_EXPORT_RECORDS
} from "./config.js";

export const PORTABLE_FORMAT = "source-wire.portable.v1";
export const PORTABLE_FORMAT_VERSION = 1;
export const PORTABLE_ORDERING = "section-v1-primary-key-utf8";

export const PORTABLE_SECTION_ORDER = [
  "owners",
  "namespaces",
  "actors",
  "candidates",
  "candidateProvenance",
  "candidateDecisions",
  "memories",
  "revisions",
  "trustedProvenance",
  "lifecycleEvents",
  "mutationAudits"
] as const;

export type PortableSection = (typeof PORTABLE_SECTION_ORDER)[number];
export type PortableJson =
  | null
  | boolean
  | number
  | string
  | PortableJson[]
  | { [key: string]: PortableJson };
export type PortableRecord = Record<string, PortableJson>;
export type PortableSectionRecords = {
  [Section in PortableSection]: PortableRecord[];
};

export type PortableManifest = {
  format: typeof PORTABLE_FORMAT;
  formatVersion: typeof PORTABLE_FORMAT_VERSION;
  schemaVersion: number;
  createdAt: string;
  snapshotCutoff: string;
  namespaceIds: string[];
  ordering: typeof PORTABLE_ORDERING;
  sectionCounts: Record<PortableSection, number>;
  sectionDigests: Record<PortableSection, string>;
  governedRecordCount: number;
  logicalStateSha256: string;
};

export type EncodedPortableBundle = {
  bytes: Buffer;
  fileSha256: string;
  logicalStateSha256: string;
  governedRecordCount: number;
  manifest: PortableManifest;
};

export type ParsedPortableBundle = {
  sections: PortableSectionRecords;
  manifest: PortableManifest;
  logicalStateSha256: string;
  governedRecordCount: number;
};

type EncodePortableBundleInput = {
  schemaVersion: number;
  createdAt: string;
  snapshotCutoff: string;
  namespaceIds: string[];
  sections: PortableSectionRecords;
};

const SHA256 = /^[0-9a-f]{64}$/u;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/u;
const FORBIDDEN_FIELD =
  /(token|secret|verifier|credential|protected.*receipt|idempotency|environment|connection|database|cache|log|private.*path|file.*path)/iu;
const LOGICAL_DIGEST_DOMAIN = "source-wire.portable.logical-state.v1\u0000";
const SECTION_DIGEST_DOMAIN = "source-wire.portable.section.v1\u0000";

const RECORD_FIELDS: Record<PortableSection, readonly string[]> = {
  owners: ["ownerId"],
  namespaces: ["namespaceId", "ownerId", "createdAt"],
  actors: ["actorIdentityId", "ownerId", "actorClass", "createdAt"],
  candidates: [
    "candidateId",
    "ownerId",
    "namespaceId",
    "proposedByActorId",
    "state",
    "content",
    "contentByteCount",
    "createdAt",
    "updatedAt",
    "decidedAt",
    "decidedByActorId"
  ],
  candidateProvenance: [
    "candidateId",
    "ownerId",
    "namespaceId",
    "provenanceKind",
    "ownerAssertion",
    "priorMemoryId",
    "priorRevisionId",
    "createdAt"
  ],
  candidateDecisions: [
    "candidateId",
    "ownerId",
    "namespaceId",
    "decision",
    "expectedState",
    "reason",
    "decidedByActorId",
    "trustedMemoryId",
    "trustedRevisionId",
    "decidedAt"
  ],
  memories: [
    "memoryId",
    "ownerId",
    "namespaceId",
    "originCandidateId",
    "state",
    "createdAt"
  ],
  revisions: [
    "revisionId",
    "memoryId",
    "ownerId",
    "namespaceId",
    "revisionNumber",
    "status",
    "content",
    "contentByteCount",
    "originCandidateId",
    "createdByActorId",
    "createdAt"
  ],
  trustedProvenance: [
    "provenanceId",
    "provenanceKey",
    "revisionId",
    "memoryId",
    "ownerId",
    "namespaceId",
    "originCandidateId",
    "provenanceKind",
    "ownerAssertion",
    "priorMemoryId",
    "priorRevisionId",
    "createdAt"
  ],
  lifecycleEvents: [
    "lifecycleEventId",
    "ownerId",
    "namespaceId",
    "memoryId",
    "eventType",
    "expectedRevisionId",
    "resultingRevisionId",
    "reason",
    "actorIdentityId",
    "occurredAt"
  ],
  mutationAudits: [
    "eventId",
    "occurredAt",
    "traceId",
    "operation",
    "result",
    "actorIdentityId",
    "ownerId",
    "namespaceId",
    "denialCode",
    "metadata"
  ]
};

const PRIMARY_KEY_FIELD: Record<PortableSection, string> = {
  owners: "ownerId",
  namespaces: "namespaceId",
  actors: "actorIdentityId",
  candidates: "candidateId",
  candidateProvenance: "candidateId",
  candidateDecisions: "candidateId",
  memories: "memoryId",
  revisions: "revisionId",
  trustedProvenance: "provenanceId",
  lifecycleEvents: "lifecycleEventId",
  mutationAudits: "eventId"
};

const AUDIT_METADATA_FIELDS: Record<string, readonly string[]> = {
  propose_memory_candidate: [
    "candidateId",
    "contentByteCount",
    "provenanceKind"
  ],
  decide_memory_candidate: [
    "candidateId",
    "state",
    "trustedMemoryCreated"
  ],
  correct_trusted_memory: [
    "expectedRevisionId",
    "lifecycleState",
    "memoryId",
    "resultingRevisionId"
  ],
  revoke_trusted_memory: [
    "expectedRevisionId",
    "lifecycleState",
    "memoryId",
    "resultingRevisionId"
  ],
  initialize_from_export: [
    "governedRecordCount",
    "logicalStateSha256",
    "restoreReceiptId"
  ],
  physical_recovery: [
    "governedRecordCount",
    "restoreReceiptId"
  ]
};

export function emptyPortableSections(): PortableSectionRecords {
  return Object.fromEntries(
    PORTABLE_SECTION_ORDER.map((section) => [section, []])
  ) as unknown as PortableSectionRecords;
}

export function encodePortableBundle(
  input: EncodePortableBundleInput
): EncodedPortableBundle {
  assertSafeInteger(input.schemaVersion, "schemaVersion", 1);
  assertTimestamp(input.createdAt, "createdAt");
  assertTimestamp(input.snapshotCutoff, "snapshotCutoff");
  const namespaceIds = validateNamespaceIds(input.namespaceIds);
  const sectionCounts = {} as Record<PortableSection, number>;
  const sectionDigests = {} as Record<PortableSection, string>;
  const lines: string[] = [
    canonicalPortableJson({
      format: PORTABLE_FORMAT,
      formatVersion: PORTABLE_FORMAT_VERSION,
      kind: "header",
      schemaVersion: input.schemaVersion
    })
  ];
  let governedRecordCount = 0;

  for (const section of PORTABLE_SECTION_ORDER) {
    const records = input.sections[section];
    if (!Array.isArray(records)) invalid();
    assertRecordsInOrder(section, records);
    const sectionHash = createHash("sha256").update(
      `${SECTION_DIGEST_DOMAIN}${section}\u0000`,
      "utf8"
    );
    for (const record of records) {
      validatePortableRecord(section, record);
      const line = canonicalPortableJson({
        kind: "record",
        record,
        section
      });
      assertLineBound(line);
      lines.push(line);
      sectionHash.update(line, "utf8");
      sectionHash.update("\n", "utf8");
      governedRecordCount += 1;
      if (governedRecordCount > MAX_PORTABLE_EXPORT_RECORDS) invalid();
    }
    sectionCounts[section] = records.length;
    sectionDigests[section] = sectionHash.digest("hex");
  }

  const logicalDescriptor = {
    format: PORTABLE_FORMAT,
    formatVersion: PORTABLE_FORMAT_VERSION,
    namespaceIds,
    ordering: PORTABLE_ORDERING,
    schemaVersion: input.schemaVersion,
    sectionCounts,
    sectionDigests
  };
  const logicalStateSha256 = createHash("sha256")
    .update(LOGICAL_DIGEST_DOMAIN, "utf8")
    .update(canonicalPortableJson(logicalDescriptor), "utf8")
    .digest("hex");
  const manifest: PortableManifest = {
    format: PORTABLE_FORMAT,
    formatVersion: PORTABLE_FORMAT_VERSION,
    schemaVersion: input.schemaVersion,
    createdAt: input.createdAt,
    snapshotCutoff: input.snapshotCutoff,
    namespaceIds,
    ordering: PORTABLE_ORDERING,
    sectionCounts,
    sectionDigests,
    governedRecordCount,
    logicalStateSha256
  };
  const manifestLine = canonicalPortableJson({
    kind: "manifest",
    manifest
  });
  assertLineBound(manifestLine);
  lines.push(manifestLine);
  const bytes = Buffer.from(`${lines.join("\n")}\n`, "utf8");
  if (bytes.length > MAX_PORTABLE_EXPORT_BYTES) invalid();

  return {
    bytes,
    fileSha256: createHash("sha256").update(bytes).digest("hex"),
    logicalStateSha256,
    governedRecordCount,
    manifest
  };
}

export function parsePortableBundle(
  bytes: Buffer,
  expectedLogicalStateSha256: string
): ParsedPortableBundle {
  if (
    bytes.length < 1 ||
    bytes.length > MAX_PORTABLE_EXPORT_BYTES ||
    !SHA256.test(expectedLogicalStateSha256)
  ) {
    invalid();
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    invalid();
  }
  if (
    text.includes("\u0000") ||
    text.includes("\r") ||
    !text.endsWith("\n")
  ) {
    invalid();
  }
  const lines = text.slice(0, -1).split("\n");
  if (lines.length < 2 || lines.some((line) => line.length === 0)) invalid();
  for (const line of lines) assertLineBound(line);

  const header = parseCanonicalObjectLine(lines[0]!);
  assertExactKeys(header, ["format", "formatVersion", "kind", "schemaVersion"]);
  if (
    header.kind !== "header" ||
    header.format !== PORTABLE_FORMAT ||
    header.formatVersion !== PORTABLE_FORMAT_VERSION
  ) {
    invalid();
  }
  assertSafeInteger(header.schemaVersion, "schemaVersion", 1);

  const trailer = parseCanonicalObjectLine(lines.at(-1)!);
  assertExactKeys(trailer, ["kind", "manifest"]);
  if (trailer.kind !== "manifest" || !isPlainObject(trailer.manifest)) {
    invalid();
  }
  const manifest = validateManifest(
    trailer.manifest,
    header.schemaVersion as number
  );
  const sections = emptyPortableSections();
  let previousSectionIndex = -1;
  let previousPrimaryKey: string | undefined;
  let governedRecordCount = 0;

  for (const line of lines.slice(1, -1)) {
    const envelope = parseCanonicalObjectLine(line);
    assertExactKeys(envelope, ["kind", "record", "section"]);
    if (
      envelope.kind !== "record" ||
      typeof envelope.section !== "string" ||
      !isPortableSection(envelope.section) ||
      !isPlainObject(envelope.record)
    ) {
      invalid();
    }
    const section = envelope.section;
    const sectionIndex = PORTABLE_SECTION_ORDER.indexOf(section);
    if (sectionIndex < previousSectionIndex) invalid();
    if (sectionIndex !== previousSectionIndex) {
      previousSectionIndex = sectionIndex;
      previousPrimaryKey = undefined;
    }
    validatePortableRecord(section, envelope.record);
    const primaryKey = readPrimaryKey(section, envelope.record);
    if (
      previousPrimaryKey !== undefined &&
      compareUtf8(previousPrimaryKey, primaryKey) >= 0
    ) {
      invalid();
    }
    previousPrimaryKey = primaryKey;
    sections[section].push(envelope.record);
    governedRecordCount += 1;
    if (governedRecordCount > MAX_PORTABLE_EXPORT_RECORDS) invalid();
  }

  const recomputed = encodePortableBundle({
    schemaVersion: header.schemaVersion as number,
    createdAt: manifest.createdAt,
    snapshotCutoff: manifest.snapshotCutoff,
    namespaceIds: manifest.namespaceIds,
    sections
  });
  if (
    recomputed.logicalStateSha256 !== expectedLogicalStateSha256 ||
    recomputed.logicalStateSha256 !== manifest.logicalStateSha256 ||
    recomputed.governedRecordCount !== manifest.governedRecordCount ||
    !timingIndependentEqual(recomputed.bytes, bytes)
  ) {
    invalid();
  }

  return {
    sections,
    manifest,
    logicalStateSha256: recomputed.logicalStateSha256,
    governedRecordCount
  };
}

export function canonicalPortableJson(value: unknown): string {
  return canonicalJsonValue(value);
}

function validateManifest(
  value: Record<string, PortableJson>,
  schemaVersion: number
): PortableManifest {
  assertExactKeys(value, [
    "createdAt",
    "format",
    "formatVersion",
    "governedRecordCount",
    "logicalStateSha256",
    "namespaceIds",
    "ordering",
    "schemaVersion",
    "sectionCounts",
    "sectionDigests",
    "snapshotCutoff"
  ]);
  if (
    value.format !== PORTABLE_FORMAT ||
    value.formatVersion !== PORTABLE_FORMAT_VERSION ||
    value.schemaVersion !== schemaVersion ||
    value.ordering !== PORTABLE_ORDERING ||
    !SHA256.test(String(value.logicalStateSha256))
  ) {
    invalid();
  }
  assertTimestamp(value.createdAt, "createdAt");
  assertTimestamp(value.snapshotCutoff, "snapshotCutoff");
  assertSafeInteger(value.governedRecordCount, "governedRecordCount", 0);
  if (
    !Array.isArray(value.namespaceIds) ||
    !isPlainObject(value.sectionCounts) ||
    !isPlainObject(value.sectionDigests)
  ) {
    invalid();
  }
  const namespaceIds = validateNamespaceIds(value.namespaceIds);
  assertExactKeys(value.sectionCounts, [...PORTABLE_SECTION_ORDER]);
  assertExactKeys(value.sectionDigests, [...PORTABLE_SECTION_ORDER]);
  const sectionCounts = {} as Record<PortableSection, number>;
  const sectionDigests = {} as Record<PortableSection, string>;
  for (const section of PORTABLE_SECTION_ORDER) {
    const count = value.sectionCounts[section];
    const digest = value.sectionDigests[section];
    assertSafeInteger(count, `${section}Count`, 0);
    if (typeof digest !== "string" || !SHA256.test(digest)) invalid();
    sectionCounts[section] = count;
    sectionDigests[section] = digest;
  }
  return {
    format: PORTABLE_FORMAT,
    formatVersion: PORTABLE_FORMAT_VERSION,
    schemaVersion,
    createdAt: value.createdAt as string,
    snapshotCutoff: value.snapshotCutoff as string,
    namespaceIds,
    ordering: PORTABLE_ORDERING,
    sectionCounts,
    sectionDigests,
    governedRecordCount: value.governedRecordCount as number,
    logicalStateSha256: value.logicalStateSha256 as string
  };
}

function validatePortableRecord(
  section: PortableSection,
  record: PortableRecord
): void {
  assertExactKeys(record, [...RECORD_FIELDS[section]]);
  assertNoForbiddenFields(record);

  switch (section) {
    case "owners":
      assertIdentifier(record.ownerId, "ownerId");
      break;
    case "namespaces":
      assertIdentifier(record.namespaceId, "namespaceId");
      assertIdentifier(record.ownerId, "ownerId");
      assertTimestamp(record.createdAt, "createdAt");
      break;
    case "actors":
      assertUuid(record.actorIdentityId, "actorIdentityId");
      assertIdentifier(record.ownerId, "ownerId");
      assertEnum(record.actorClass, ["owner_admin", "harness"]);
      assertTimestamp(record.createdAt, "createdAt");
      break;
    case "candidates":
      assertUuid(record.candidateId, "candidateId");
      assertIdentifier(record.ownerId, "ownerId");
      assertIdentifier(record.namespaceId, "namespaceId");
      assertUuid(record.proposedByActorId, "proposedByActorId");
      assertEnum(record.state, ["pending", "approved", "rejected"]);
      assertBoundedText(record.content, 1, 8_192);
      assertByteCount(record.content, record.contentByteCount);
      assertTimestamp(record.createdAt, "createdAt");
      assertTimestamp(record.updatedAt, "updatedAt");
      assertNullableTimestamp(record.decidedAt);
      assertNullableUuid(record.decidedByActorId);
      if (
        (record.state === "pending" &&
          (record.decidedAt !== null ||
            record.decidedByActorId !== null)) ||
        (record.state !== "pending" &&
          (record.decidedAt === null ||
            record.decidedByActorId === null))
      ) {
        invalid();
      }
      break;
    case "candidateProvenance":
      assertUuid(record.candidateId, "candidateId");
      assertIdentifier(record.ownerId, "ownerId");
      assertIdentifier(record.namespaceId, "namespaceId");
      assertEnum(record.provenanceKind, ["owner_assertion", "prior_memory"]);
      assertNullableBoundedText(record.ownerAssertion, 1, 1_024);
      assertNullableUuid(record.priorMemoryId);
      assertNullableUuid(record.priorRevisionId);
      assertTimestamp(record.createdAt, "createdAt");
      assertProvenanceShape(record);
      break;
    case "candidateDecisions":
      assertUuid(record.candidateId, "candidateId");
      assertIdentifier(record.ownerId, "ownerId");
      assertIdentifier(record.namespaceId, "namespaceId");
      assertEnum(record.decision, ["approve", "reject"]);
      if (record.expectedState !== "pending") invalid();
      assertBoundedText(record.reason, 1, 512);
      assertUuid(record.decidedByActorId, "decidedByActorId");
      assertNullableUuid(record.trustedMemoryId);
      assertNullableUuid(record.trustedRevisionId);
      assertTimestamp(record.decidedAt, "decidedAt");
      if (
        (record.decision === "approve" &&
          (record.trustedMemoryId === null ||
            record.trustedRevisionId === null)) ||
        (record.decision === "reject" &&
          (record.trustedMemoryId !== null ||
            record.trustedRevisionId !== null))
      ) {
        invalid();
      }
      break;
    case "memories":
      assertUuid(record.memoryId, "memoryId");
      assertIdentifier(record.ownerId, "ownerId");
      assertIdentifier(record.namespaceId, "namespaceId");
      assertUuid(record.originCandidateId, "originCandidateId");
      assertEnum(record.state, ["active", "revoked"]);
      assertTimestamp(record.createdAt, "createdAt");
      break;
    case "revisions":
      assertUuid(record.revisionId, "revisionId");
      assertUuid(record.memoryId, "memoryId");
      assertIdentifier(record.ownerId, "ownerId");
      assertIdentifier(record.namespaceId, "namespaceId");
      assertSafeInteger(record.revisionNumber, "revisionNumber", 1);
      assertEnum(record.status, ["active", "superseded", "revoked"]);
      assertBoundedText(record.content, 1, 8_192);
      assertByteCount(record.content, record.contentByteCount);
      assertUuid(record.originCandidateId, "originCandidateId");
      assertUuid(record.createdByActorId, "createdByActorId");
      assertTimestamp(record.createdAt, "createdAt");
      break;
    case "trustedProvenance":
      assertUuid(record.provenanceId, "provenanceId");
      assertBoundedText(record.provenanceKey, 1, 160);
      assertUuid(record.revisionId, "revisionId");
      assertUuid(record.memoryId, "memoryId");
      assertIdentifier(record.ownerId, "ownerId");
      assertIdentifier(record.namespaceId, "namespaceId");
      assertUuid(record.originCandidateId, "originCandidateId");
      assertEnum(record.provenanceKind, [
        "owner_assertion",
        "prior_memory",
        "correction_lineage"
      ]);
      assertNullableBoundedText(record.ownerAssertion, 1, 1_024);
      assertNullableUuid(record.priorMemoryId);
      assertNullableUuid(record.priorRevisionId);
      assertTimestamp(record.createdAt, "createdAt");
      assertProvenanceShape(record);
      break;
    case "lifecycleEvents":
      assertUuid(record.lifecycleEventId, "lifecycleEventId");
      assertIdentifier(record.ownerId, "ownerId");
      assertIdentifier(record.namespaceId, "namespaceId");
      assertUuid(record.memoryId, "memoryId");
      assertEnum(record.eventType, ["correction", "revocation"]);
      assertUuid(record.expectedRevisionId, "expectedRevisionId");
      assertUuid(record.resultingRevisionId, "resultingRevisionId");
      assertBoundedText(record.reason, 1, 512);
      assertUuid(record.actorIdentityId, "actorIdentityId");
      assertTimestamp(record.occurredAt, "occurredAt");
      if (
        (record.eventType === "correction" &&
          record.expectedRevisionId === record.resultingRevisionId) ||
        (record.eventType === "revocation" &&
          record.expectedRevisionId !== record.resultingRevisionId)
      ) {
        invalid();
      }
      break;
    case "mutationAudits":
      assertUuid(record.eventId, "eventId");
      assertTimestamp(record.occurredAt, "occurredAt");
      assertUuid(record.traceId, "traceId");
      if (
        typeof record.operation !== "string" ||
        !(record.operation in AUDIT_METADATA_FIELDS) ||
        record.result !== "allowed"
      ) {
        invalid();
      }
      assertNullableUuid(record.actorIdentityId);
      assertIdentifier(record.ownerId, "ownerId");
      if (record.namespaceId !== null) {
        assertIdentifier(record.namespaceId, "namespaceId");
      }
      if (record.denialCode !== null || !isPlainObject(record.metadata)) {
        invalid();
      }
      validateAuditMetadata(record.operation, record.metadata);
      break;
  }
}

function validateAuditMetadata(
  operation: string,
  metadata: Record<string, PortableJson>
): void {
  const fields = AUDIT_METADATA_FIELDS[operation];
  if (!fields) invalid();
  assertExactKeys(metadata, [...fields]);
  assertNoForbiddenFields(metadata);
  for (const value of Object.values(metadata)) {
    if (
      value !== null &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      invalid();
    }
    if (typeof value === "number" && !Number.isSafeInteger(value)) invalid();
  }
  if ("candidateId" in metadata) assertUuid(metadata.candidateId, "candidateId");
  if ("memoryId" in metadata) assertUuid(metadata.memoryId, "memoryId");
  if ("expectedRevisionId" in metadata) {
    assertUuid(metadata.expectedRevisionId, "expectedRevisionId");
  }
  if ("resultingRevisionId" in metadata) {
    assertUuid(metadata.resultingRevisionId, "resultingRevisionId");
  }
  if ("restoreReceiptId" in metadata) {
    assertUuid(metadata.restoreReceiptId, "restoreReceiptId");
  }
  if ("logicalStateSha256" in metadata) {
    if (
      typeof metadata.logicalStateSha256 !== "string" ||
      !SHA256.test(metadata.logicalStateSha256)
    ) {
      invalid();
    }
  }
}

function assertProvenanceShape(record: PortableRecord): void {
  if (
    (record.provenanceKind === "owner_assertion" &&
      (record.ownerAssertion === null ||
        record.priorMemoryId !== null ||
        record.priorRevisionId !== null)) ||
    (record.provenanceKind !== "owner_assertion" &&
      (record.ownerAssertion !== null ||
        record.priorMemoryId === null ||
        record.priorRevisionId === null))
  ) {
    invalid();
  }
}

function assertRecordsInOrder(
  section: PortableSection,
  records: PortableRecord[]
): void {
  let previous: string | undefined;
  for (const record of records) {
    const primaryKey = readPrimaryKey(section, record);
    if (previous !== undefined && compareUtf8(previous, primaryKey) >= 0) {
      invalid();
    }
    previous = primaryKey;
  }
}

function readPrimaryKey(
  section: PortableSection,
  record: PortableRecord
): string {
  const value = record[PRIMARY_KEY_FIELD[section]];
  if (typeof value !== "string") invalid();
  return value;
}

function validateNamespaceIds(value: unknown[]): string[] {
  if (value.length < 1 || value.length > 64) invalid();
  const namespaceIds = value.map((item) => {
    assertIdentifier(item, "namespaceId");
    return item as string;
  });
  const sorted = [...namespaceIds].sort(compareUtf8);
  if (
    new Set(namespaceIds).size !== namespaceIds.length ||
    namespaceIds.some((item, index) => item !== sorted[index])
  ) {
    invalid();
  }
  return namespaceIds;
}

function assertNoForbiddenFields(value: PortableJson): void {
  if (Array.isArray(value)) {
    for (const item of value) assertNoForbiddenFields(item);
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_FIELD.test(key)) invalid();
    assertNoForbiddenFields(item);
  }
}

function assertExactKeys(
  value: Record<string, PortableJson>,
  expected: string[]
): void {
  const actual = Object.keys(value).sort(compareUtf8);
  const sortedExpected = [...expected].sort(compareUtf8);
  if (
    actual.length !== sortedExpected.length ||
    actual.some((key, index) => key !== sortedExpected[index])
  ) {
    invalid();
  }
}

function assertUuid(value: unknown, _field: string): asserts value is string {
  if (typeof value !== "string" || !UUID_V4.test(value)) invalid();
}

function assertNullableUuid(value: unknown): void {
  if (value !== null) assertUuid(value, "uuid");
}

function assertIdentifier(
  value: unknown,
  _field: string
): asserts value is string {
  if (typeof value !== "string" || !IDENTIFIER.test(value) || value === "*") {
    invalid();
  }
}

function assertEnum(value: unknown, values: readonly string[]): void {
  if (typeof value !== "string" || !values.includes(value)) invalid();
}

function assertTimestamp(
  value: unknown,
  _field: string
): asserts value is string {
  if (typeof value !== "string") invalid();
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) invalid();
}

function assertNullableTimestamp(value: unknown): void {
  if (value !== null) assertTimestamp(value, "timestamp");
}

function assertBoundedText(value: unknown, minimum: number, maximum: number): void {
  if (
    typeof value !== "string" ||
    value.includes("\u0000") ||
    Buffer.byteLength(value, "utf8") < minimum ||
    Buffer.byteLength(value, "utf8") > maximum
  ) {
    invalid();
  }
  assertUnicodeScalarString(value);
}

function assertNullableBoundedText(
  value: unknown,
  minimum: number,
  maximum: number
): void {
  if (value !== null) assertBoundedText(value, minimum, maximum);
}

function assertByteCount(text: unknown, byteCount: unknown): void {
  assertSafeInteger(byteCount, "byteCount", 1);
  if (
    typeof text !== "string" ||
    Buffer.byteLength(text, "utf8") !== byteCount
  ) {
    invalid();
  }
}

function assertSafeInteger(
  value: unknown,
  _field: string,
  minimum: number
): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) invalid();
}

function assertLineBound(line: string): void {
  if (Buffer.byteLength(line, "utf8") > MAX_PORTABLE_EXPORT_LINE_BYTES) {
    invalid();
  }
}

function parseCanonicalObjectLine(
  line: string
): Record<string, PortableJson> {
  const parsed = new StrictJsonParser(line).parse();
  if (!isPlainObject(parsed) || canonicalPortableJson(parsed) !== line) {
    invalid();
  }
  return parsed;
}

function canonicalJsonValue(value: unknown): string {
  if (value === null || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "string") {
    assertUnicodeScalarString(value);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) invalid();
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJsonValue(item)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => compareUtf8(left, right))
      .map(
        ([key, item]) =>
          `${canonicalJsonValue(key)}:${canonicalJsonValue(item)}`
      )
      .join(",")}}`;
  }
  invalid();
}

function isPortableSection(value: string): value is PortableSection {
  return PORTABLE_SECTION_ORDER.includes(value as PortableSection);
}

function isPlainObject(
  value: unknown
): value is Record<string, PortableJson> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function timingIndependentEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && left.equals(right);
}

function assertUnicodeScalarString(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) invalid();
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      invalid();
    }
  }
}

function invalid(): never {
  throw new Error("portable_bundle_invalid");
}

class StrictJsonParser {
  private index = 0;

  constructor(private readonly text: string) {}

  parse(): PortableJson {
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.index !== this.text.length) invalid();
    return value;
  }

  private parseValue(): PortableJson {
    this.skipWhitespace();
    const character = this.text[this.index];
    if (character === "{") return this.parseObject();
    if (character === "[") return this.parseArray();
    if (character === '"') return this.parseString();
    if (character === "t") return this.parseLiteral("true", true);
    if (character === "f") return this.parseLiteral("false", false);
    if (character === "n") return this.parseLiteral("null", null);
    return this.parseInteger();
  }

  private parseObject(): Record<string, PortableJson> {
    this.expect("{");
    const result: Record<string, PortableJson> = {};
    const keys = new Set<string>();
    this.skipWhitespace();
    if (this.peek("}")) {
      this.index += 1;
      return result;
    }
    while (true) {
      this.skipWhitespace();
      const key = this.parseString();
      if (keys.has(key)) invalid();
      keys.add(key);
      this.skipWhitespace();
      this.expect(":");
      result[key] = this.parseValue();
      this.skipWhitespace();
      if (this.peek("}")) {
        this.index += 1;
        return result;
      }
      this.expect(",");
    }
  }

  private parseArray(): PortableJson[] {
    this.expect("[");
    const result: PortableJson[] = [];
    this.skipWhitespace();
    if (this.peek("]")) {
      this.index += 1;
      return result;
    }
    while (true) {
      result.push(this.parseValue());
      this.skipWhitespace();
      if (this.peek("]")) {
        this.index += 1;
        return result;
      }
      this.expect(",");
    }
  }

  private parseString(): string {
    if (!this.peek('"')) invalid();
    const start = this.index;
    this.index += 1;
    let escaped = false;
    while (this.index < this.text.length) {
      const character = this.text[this.index]!;
      const code = character.charCodeAt(0);
      if (!escaped && character === '"') {
        this.index += 1;
        const value = JSON.parse(
          this.text.slice(start, this.index)
        ) as unknown;
        if (typeof value !== "string") invalid();
        assertUnicodeScalarString(value);
        return value;
      }
      if (!escaped && character === "\\") {
        escaped = true;
        this.index += 1;
        continue;
      }
      if (!escaped && code < 0x20) invalid();
      escaped = false;
      this.index += 1;
    }
    invalid();
  }

  private parseInteger(): number {
    const rest = this.text.slice(this.index);
    const match = /^(?:0|-?[1-9][0-9]*)/u.exec(rest);
    if (!match) invalid();
    const raw = match[0]!;
    this.index += raw.length;
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) invalid();
    return value;
  }

  private parseLiteral<T extends boolean | null>(
    literal: string,
    value: T
  ): T {
    if (!this.text.startsWith(literal, this.index)) invalid();
    this.index += literal.length;
    return value;
  }

  private skipWhitespace(): void {
    while (/\s/u.test(this.text[this.index] ?? "")) this.index += 1;
  }

  private expect(value: string): void {
    if (!this.peek(value)) invalid();
    this.index += value.length;
  }

  private peek(value: string): boolean {
    return this.text.startsWith(value, this.index);
  }
}
