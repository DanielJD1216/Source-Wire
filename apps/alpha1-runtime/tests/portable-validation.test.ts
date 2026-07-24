import assert from "node:assert/strict";
import test from "node:test";

import {
  encodePortableBundle,
  emptyPortableSections,
  parsePortableBundle,
  type PortableSectionRecords
} from "../src/portable-format.js";
import { validatePortableState } from "../src/portable-validation.js";

const actorId = "11111111-1111-4111-8111-111111111111";
const candidateId = "22222222-2222-4222-8222-222222222222";
const memoryId = "33333333-3333-4333-8333-333333333333";
const revisionId = "44444444-4444-4444-8444-444444444444";
const provenanceId = "55555555-5555-4555-8555-555555555555";

test("portable state validation accepts closed governed history", () => {
  const bundle = bundleFrom(completeSections());
  assert.deepEqual(
    validatePortableState(
      parsePortableBundle(bundle.bytes, bundle.logicalStateSha256)
    ),
    {
      ownerId: "owner_alpha",
      namespaceIds: ["ns_alpha"],
      governedRecordCount: 11,
      logicalStateSha256: bundle.logicalStateSha256
    }
  );
});

test("portable state validation rejects a decision that points outside its memory graph", () => {
  const sections = completeSections();
  sections.candidateDecisions[0]!.trustedMemoryId =
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const bundle = bundleFrom(sections);
  assert.throws(
    () =>
      validatePortableState(
        parsePortableBundle(bundle.bytes, bundle.logicalStateSha256)
      ),
    /portable_state_invalid/u
  );
});

test("portable state validation accepts correction history with matching provenance and audit", () => {
  const sections = correctedSections();
  const bundle = bundleFrom(sections);
  assert.equal(
    validatePortableState(
      parsePortableBundle(bundle.bytes, bundle.logicalStateSha256)
    ).governedRecordCount,
    17
  );
});

test("portable state validation rejects correction reason or actor drift", () => {
  const reasonDrift = correctedSections();
  const correctionAssertion = reasonDrift.trustedProvenance.find(
    (record) =>
      record.provenanceKey ===
      "correction-owner-assertion:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
  );
  assert(correctionAssertion);
  correctionAssertion.ownerAssertion = "A different owner assertion.";
  assertInvalid(reasonDrift);

  const actorDrift = correctedSections();
  actorDrift.mutationAudits[2]!.actorIdentityId =
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  actorDrift.actors.push({
    actorIdentityId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ownerId: "owner_alpha",
    actorClass: "owner_admin",
    createdAt: "2026-07-24T00:00:00.000Z"
  });
  assertInvalid(actorDrift);
});

test("portable state validation rejects records newer than the snapshot cutoff", () => {
  const sections = completeSections();
  sections.namespaces[0]!.createdAt = "2026-07-24T02:00:00.000Z";
  assertInvalid(sections);
});

function bundleFrom(sections: PortableSectionRecords) {
  return encodePortableBundle({
    schemaVersion: 4,
    createdAt: "2026-07-24T01:00:00.000Z",
    snapshotCutoff: "2026-07-24T01:00:00.000Z",
    namespaceIds: ["ns_alpha"],
    sections
  });
}

function completeSections(): PortableSectionRecords {
  const sections = emptyPortableSections();
  sections.owners.push({ ownerId: "owner_alpha" });
  sections.namespaces.push({
    namespaceId: "ns_alpha",
    ownerId: "owner_alpha",
    createdAt: "2026-07-24T00:00:00.000Z"
  });
  sections.actors.push({
    actorIdentityId: actorId,
    ownerId: "owner_alpha",
    actorClass: "owner_admin",
    createdAt: "2026-07-24T00:00:00.000Z"
  });
  sections.candidates.push({
    candidateId,
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    proposedByActorId: actorId,
    state: "approved",
    content: "Remember the synthetic verification rule.",
    contentByteCount: 41,
    createdAt: "2026-07-24T00:10:00.000Z",
    updatedAt: "2026-07-24T00:20:00.000Z",
    decidedAt: "2026-07-24T00:20:00.000Z",
    decidedByActorId: actorId
  });
  sections.candidateProvenance.push({
    candidateId,
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    provenanceKind: "owner_assertion",
    ownerAssertion: "Synthetic owner evidence.",
    priorMemoryId: null,
    priorRevisionId: null,
    createdAt: "2026-07-24T00:10:00.000Z"
  });
  sections.candidateDecisions.push({
    candidateId,
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    decision: "approve",
    expectedState: "pending",
    reason: "Approved for synthetic conformance.",
    decidedByActorId: actorId,
    trustedMemoryId: memoryId,
    trustedRevisionId: revisionId,
    decidedAt: "2026-07-24T00:20:00.000Z"
  });
  sections.memories.push({
    memoryId,
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    originCandidateId: candidateId,
    state: "active",
    createdAt: "2026-07-24T00:20:00.000Z"
  });
  sections.revisions.push({
    revisionId,
    memoryId,
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    revisionNumber: 1,
    status: "active",
    content: "Remember the synthetic verification rule.",
    contentByteCount: 41,
    originCandidateId: candidateId,
    createdByActorId: actorId,
    createdAt: "2026-07-24T00:20:00.000Z"
  });
  sections.trustedProvenance.push({
    provenanceId,
    provenanceKey: `origin:${candidateId}:owner_assertion`,
    revisionId,
    memoryId,
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    originCandidateId: candidateId,
    provenanceKind: "owner_assertion",
    ownerAssertion: "Synthetic owner evidence.",
    priorMemoryId: null,
    priorRevisionId: null,
    createdAt: "2026-07-24T00:20:00.000Z"
  });
  sections.mutationAudits.push(
    {
      eventId: "66666666-6666-4666-8666-666666666666",
      occurredAt: "2026-07-24T00:10:00.000Z",
      traceId: "88888888-8888-4888-8888-888888888888",
      operation: "propose_memory_candidate",
      result: "allowed",
      actorIdentityId: actorId,
      ownerId: "owner_alpha",
      namespaceId: "ns_alpha",
      denialCode: null,
      metadata: {
        candidateId,
        contentByteCount: 41,
        provenanceKind: "owner_assertion"
      }
    },
    {
      eventId: "77777777-7777-4777-8777-777777777777",
      occurredAt: "2026-07-24T00:20:00.000Z",
      traceId: "99999999-9999-4999-8999-999999999999",
      operation: "decide_memory_candidate",
      result: "allowed",
      actorIdentityId: actorId,
      ownerId: "owner_alpha",
      namespaceId: "ns_alpha",
      denialCode: null,
      metadata: {
        candidateId,
        state: "approved",
        trustedMemoryCreated: true
      }
    }
  );
  return sections;
}

function correctedSections(): PortableSectionRecords {
  const sections = completeSections();
  const correctedRevisionId =
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const correctedAt = "2026-07-24T00:30:00.000Z";
  const reason = "Corrected through synthetic owner review.";
  sections.revisions[0]!.status = "superseded";
  sections.revisions.push({
    revisionId: correctedRevisionId,
    memoryId,
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    revisionNumber: 2,
    status: "active",
    content: "Remember the corrected synthetic verification rule.",
    contentByteCount: 51,
    originCandidateId: candidateId,
    createdByActorId: actorId,
    createdAt: correctedAt
  });
  sections.trustedProvenance.push(
    {
      provenanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab",
      provenanceKey: `correction-lineage:${revisionId}`,
      revisionId: correctedRevisionId,
      memoryId,
      ownerId: "owner_alpha",
      namespaceId: "ns_alpha",
      originCandidateId: candidateId,
      provenanceKind: "correction_lineage",
      ownerAssertion: null,
      priorMemoryId: memoryId,
      priorRevisionId: revisionId,
      createdAt: correctedAt
    },
    {
      provenanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac",
      provenanceKey: `correction-owner-assertion:${correctedRevisionId}`,
      revisionId: correctedRevisionId,
      memoryId,
      ownerId: "owner_alpha",
      namespaceId: "ns_alpha",
      originCandidateId: candidateId,
      provenanceKind: "owner_assertion",
      ownerAssertion: reason,
      priorMemoryId: null,
      priorRevisionId: null,
      createdAt: correctedAt
    }
  );
  sections.trustedProvenance.splice(1, 0, {
    provenanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    provenanceKey: `origin:${candidateId}:owner_assertion`,
    revisionId: correctedRevisionId,
    memoryId,
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    originCandidateId: candidateId,
    provenanceKind: "owner_assertion",
    ownerAssertion: "Synthetic owner evidence.",
    priorMemoryId: null,
    priorRevisionId: null,
    createdAt: correctedAt
  });
  sections.lifecycleEvents.push({
    lifecycleEventId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    memoryId,
    eventType: "correction",
    expectedRevisionId: revisionId,
    resultingRevisionId: correctedRevisionId,
    reason,
    actorIdentityId: actorId,
    occurredAt: correctedAt
  });
  sections.mutationAudits.push({
    eventId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    occurredAt: correctedAt,
    traceId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    operation: "correct_trusted_memory",
    result: "allowed",
    actorIdentityId: actorId,
    ownerId: "owner_alpha",
    namespaceId: "ns_alpha",
    denialCode: null,
    metadata: {
      expectedRevisionId: revisionId,
      lifecycleState: "active",
      memoryId,
      resultingRevisionId: correctedRevisionId
    }
  });
  return sections;
}

function assertInvalid(sections: PortableSectionRecords): void {
  const bundle = bundleFrom(sections);
  assert.throws(
    () =>
      validatePortableState(
        parsePortableBundle(bundle.bytes, bundle.logicalStateSha256)
      ),
    /portable_state_invalid/u
  );
}
