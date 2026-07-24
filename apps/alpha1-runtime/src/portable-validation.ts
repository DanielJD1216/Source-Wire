import {
  type ParsedPortableBundle,
  type PortableJson,
  type PortableRecord
} from "./portable-format.js";

type IndexedRecord = PortableRecord & Record<string, PortableJson>;

export type ValidatedPortableState = {
  ownerId: string;
  namespaceIds: string[];
  governedRecordCount: number;
  logicalStateSha256: string;
};

export function validatePortableState(
  bundle: ParsedPortableBundle
): ValidatedPortableState {
  const { sections } = bundle;
  assertRecordsAtOrBeforeSnapshot(
    sections,
    time(bundle.manifest.snapshotCutoff)
  );
  if (sections.owners.length !== 1) invalid();
  const ownerId = requiredString(sections.owners[0]!, "ownerId");
  const namespaceIds = bundle.manifest.namespaceIds;
  const namespaceSet = new Set(namespaceIds);
  if (
    sections.namespaces.length !== namespaceIds.length ||
    sections.namespaces.some(
      (record, index) =>
        requiredString(record, "namespaceId") !== namespaceIds[index] ||
        requiredString(record, "ownerId") !== ownerId
    )
  ) {
    invalid();
  }

  const actors = indexBy(sections.actors, "actorIdentityId");
  for (const actor of actors.values()) {
    requireOwner(actor, ownerId);
  }

  const candidates = indexBy(sections.candidates, "candidateId");
  const candidateProvenance = indexBy(
    sections.candidateProvenance,
    "candidateId"
  );
  const decisions = indexBy(sections.candidateDecisions, "candidateId");
  for (const candidate of candidates.values()) {
    requireScope(candidate, ownerId, namespaceSet);
    requireActor(
      actors,
      requiredString(candidate, "proposedByActorId"),
      ownerId
    );
    const candidateId = requiredString(candidate, "candidateId");
    const provenance = candidateProvenance.get(candidateId);
    if (!provenance) invalid();
    requireSameScope(candidate, provenance);
    validatePriorReferenceShape(provenance);
    const state = requiredString(candidate, "state");
    const decision = decisions.get(candidateId);
    if (state === "pending") {
      if (decision) invalid();
    } else {
      if (!decision) invalid();
      requireSameScope(candidate, decision);
      if (
        requiredString(decision, "decision") !==
          (state === "approved" ? "approve" : "reject") ||
        requiredString(decision, "decidedByActorId") !==
          requiredString(candidate, "decidedByActorId") ||
        requiredString(decision, "decidedAt") !==
          requiredString(candidate, "decidedAt")
      ) {
        invalid();
      }
      requireActor(
        actors,
        requiredString(decision, "decidedByActorId"),
        ownerId
      );
    }
    if (
      time(requiredString(candidate, "createdAt")) >
        time(requiredString(candidate, "updatedAt")) ||
      (state !== "pending" &&
        time(requiredString(candidate, "updatedAt")) >
          time(requiredString(candidate, "decidedAt")))
    ) {
      invalid();
    }
  }
  if (
    candidateProvenance.size !== candidates.size ||
    decisions.size !==
      [...candidates.values()].filter(
        (candidate) => requiredString(candidate, "state") !== "pending"
      ).length
  ) {
    invalid();
  }

  const memories = indexBy(sections.memories, "memoryId");
  const revisions = indexBy(sections.revisions, "revisionId");
  const revisionsByMemory = groupBy(sections.revisions, "memoryId");
  const provenanceByRevision = groupBy(
    sections.trustedProvenance,
    "revisionId"
  );
  const lifecycleByMemory = groupBy(
    sections.lifecycleEvents,
    "memoryId"
  );

  for (const memory of memories.values()) {
    requireScope(memory, ownerId, namespaceSet);
    const memoryId = requiredString(memory, "memoryId");
    const originCandidateId = requiredString(memory, "originCandidateId");
    const candidate = candidates.get(originCandidateId);
    const decision = decisions.get(originCandidateId);
    if (
      !candidate ||
      !decision ||
      requiredString(candidate, "state") !== "approved" ||
      requiredString(decision, "decision") !== "approve" ||
      requiredString(decision, "trustedMemoryId") !== memoryId ||
      requiredString(memory, "createdAt") !==
        requiredString(decision, "decidedAt")
    ) {
      invalid();
    }
    requireSameScope(memory, candidate);

    const orderedRevisions = [...(revisionsByMemory.get(memoryId) ?? [])].sort(
      (left, right) =>
        requiredNumber(left, "revisionNumber") -
        requiredNumber(right, "revisionNumber")
    );
    if (orderedRevisions.length < 1) invalid();
    const events = lifecycleByMemory.get(memoryId) ?? [];
    const correctionEvents = events.filter(
      (event) => requiredString(event, "eventType") === "correction"
    );
    const revocationEvents = events.filter(
      (event) => requiredString(event, "eventType") === "revocation"
    );

    for (let index = 0; index < orderedRevisions.length; index += 1) {
      const revision = orderedRevisions[index]!;
      const revisionId = requiredString(revision, "revisionId");
      const revisionNumber = requiredNumber(revision, "revisionNumber");
      if (
        revisionNumber !== index + 1 ||
        requiredString(revision, "memoryId") !== memoryId ||
        requiredString(revision, "originCandidateId") !== originCandidateId
      ) {
        invalid();
      }
      requireSameScope(memory, revision);
      requireActor(
        actors,
        requiredString(revision, "createdByActorId"),
        ownerId
      );
      const revisionProvenance = provenanceByRevision.get(revisionId) ?? [];
      if (revisionProvenance.length < 1) invalid();
      validateRevisionProvenance(
        revision,
        revisionProvenance,
        candidateProvenance.get(originCandidateId)!,
        orderedRevisions[index - 1],
        provenanceByRevision
      );

      if (index > 0) {
        const previous = orderedRevisions[index - 1]!;
        if (
          time(requiredString(previous, "createdAt")) >
          time(requiredString(revision, "createdAt"))
        ) invalid();
        const matching = correctionEvents.filter(
          (event) =>
            requiredString(event, "expectedRevisionId") ===
              requiredString(previous, "revisionId") &&
            requiredString(event, "resultingRevisionId") === revisionId
        );
        if (matching.length !== 1) invalid();
        const correction = matching[0]!;
        const ownerAssertion = revisionProvenance.find(
          (item) =>
            requiredString(item, "provenanceKey") ===
            `correction-owner-assertion:${revisionId}`
        );
        if (
          !ownerAssertion ||
          requiredString(ownerAssertion, "ownerAssertion") !==
            requiredString(correction, "reason") ||
          requiredString(ownerAssertion, "createdAt") !==
            requiredString(correction, "occurredAt") ||
          requiredString(revision, "createdAt") !==
            requiredString(correction, "occurredAt") ||
          requiredString(revision, "createdByActorId") !==
            requiredString(correction, "actorIdentityId")
        ) {
          invalid();
        }
      } else if (
        requiredString(revision, "content") !==
          requiredString(candidate, "content") ||
        requiredNumber(revision, "contentByteCount") !==
          requiredNumber(candidate, "contentByteCount") ||
        requiredString(revision, "createdByActorId") !==
          requiredString(decision, "decidedByActorId") ||
        requiredString(revision, "createdAt") !==
          requiredString(decision, "decidedAt")
      ) {
        invalid();
      }
    }

    const finalRevision = orderedRevisions.at(-1)!;
    const memoryState = requiredString(memory, "state");
    for (const revision of orderedRevisions.slice(0, -1)) {
      if (requiredString(revision, "status") !== "superseded") invalid();
    }
    if (memoryState === "active") {
      if (
        requiredString(finalRevision, "status") !== "active" ||
        revocationEvents.length !== 0
      ) {
        invalid();
      }
    } else if (
      memoryState !== "revoked" ||
      requiredString(finalRevision, "status") !== "revoked" ||
      revocationEvents.length !== 1 ||
      requiredString(revocationEvents[0]!, "expectedRevisionId") !==
        requiredString(finalRevision, "revisionId") ||
      requiredString(revocationEvents[0]!, "resultingRevisionId") !==
        requiredString(finalRevision, "revisionId") ||
      time(requiredString(revocationEvents[0]!, "occurredAt")) <
        time(requiredString(finalRevision, "createdAt"))
    ) {
      invalid();
    }
    if (correctionEvents.length !== orderedRevisions.length - 1) invalid();
    if (
      requiredString(decision, "trustedRevisionId") !==
      requiredString(orderedRevisions[0]!, "revisionId")
    ) {
      invalid();
    }
  }

  if (
    revisions.size !==
      [...revisionsByMemory.values()].reduce(
        (count, records) => count + records.length,
        0
      ) ||
    [...revisions.values()].some(
      (revision) => !memories.has(requiredString(revision, "memoryId"))
    ) ||
    sections.trustedProvenance.length !==
      [...provenanceByRevision.values()].reduce(
        (count, records) => count + records.length,
        0
      )
  ) {
    invalid();
  }

  for (const provenance of candidateProvenance.values()) {
    validatePriorReference(
      provenance,
      ownerId,
      namespaceSet,
      memories,
      revisions
    );
  }
  for (const provenance of sections.trustedProvenance) {
    validatePriorReference(
      provenance,
      ownerId,
      namespaceSet,
      memories,
      revisions
    );
  }
  for (const event of sections.lifecycleEvents) {
    requireScope(event, ownerId, namespaceSet);
    const memory = memories.get(requiredString(event, "memoryId"));
    if (!memory) invalid();
    requireSameScope(event, memory);
    requireActor(
      actors,
      requiredString(event, "actorIdentityId"),
      ownerId
    );
  }
  validateMutationAudits(
    sections.mutationAudits,
    ownerId,
    namespaceSet,
    actors,
    candidates,
    candidateProvenance,
    decisions,
    memories,
    revisions,
    sections.lifecycleEvents
  );

  return {
    ownerId,
    namespaceIds: [...namespaceIds],
    governedRecordCount: bundle.governedRecordCount,
    logicalStateSha256: bundle.logicalStateSha256
  };
}

function validateRevisionProvenance(
  revision: IndexedRecord,
  current: IndexedRecord[],
  candidateProvenance: IndexedRecord,
  previous: IndexedRecord | undefined,
  provenanceByRevision: Map<string, IndexedRecord[]>
): void {
  const revisionId = requiredString(revision, "revisionId");
  const memoryId = requiredString(revision, "memoryId");
  const keys = new Set<string>();
  for (const item of current) {
    requireSameScope(revision, item);
    if (
      requiredString(item, "revisionId") !== revisionId ||
      requiredString(item, "memoryId") !== memoryId ||
      requiredString(item, "originCandidateId") !==
        requiredString(revision, "originCandidateId")
    ) {
      invalid();
    }
    const key = requiredString(item, "provenanceKey");
    if (keys.has(key)) invalid();
    keys.add(key);
  }

  if (!previous) {
    if (current.length !== 1) invalid();
    const only = current[0]!;
    if (
      requiredString(only, "provenanceKey") !==
        `origin:${requiredString(revision, "originCandidateId")}:${requiredString(
          candidateProvenance,
          "provenanceKind"
        )}` ||
      !sameProvenancePayload(only, candidateProvenance)
    ) {
      invalid();
    }
    return;
  }

  const previousRevisionId = requiredString(previous, "revisionId");
  const previousItems =
    provenanceByRevision.get(previousRevisionId) ?? [];
  for (const item of previousItems) {
    const carried = current.find(
      (candidate) =>
        requiredString(candidate, "provenanceKey") ===
        requiredString(item, "provenanceKey")
    );
    if (!carried || !sameProvenancePayload(carried, item)) invalid();
  }
  const lineage = current.filter(
    (item) =>
      requiredString(item, "provenanceKind") === "correction_lineage" &&
      requiredString(item, "priorMemoryId") === memoryId &&
      requiredString(item, "priorRevisionId") === previousRevisionId &&
      requiredString(item, "provenanceKey") ===
        `correction-lineage:${previousRevisionId}`
  );
  const ownerAssertion = current.filter(
    (item) =>
      requiredString(item, "provenanceKind") === "owner_assertion" &&
      requiredString(item, "provenanceKey") ===
        `correction-owner-assertion:${revisionId}`
  );
  if (
    lineage.length !== 1 ||
    ownerAssertion.length !== 1 ||
    current.length !== previousItems.length + 2
  ) {
    invalid();
  }
}

function validatePriorReference(
  provenance: IndexedRecord,
  ownerId: string,
  namespaceSet: Set<string>,
  memories: Map<string, IndexedRecord>,
  revisions: Map<string, IndexedRecord>
): void {
  requireScope(provenance, ownerId, namespaceSet);
  validatePriorReferenceShape(provenance);
  if (requiredString(provenance, "provenanceKind") === "owner_assertion") {
    return;
  }
  const memory = memories.get(requiredString(provenance, "priorMemoryId"));
  const revision = revisions.get(
    requiredString(provenance, "priorRevisionId")
  );
  if (
    !memory ||
    !revision ||
    requiredString(revision, "memoryId") !==
      requiredString(memory, "memoryId")
  ) {
    invalid();
  }
  requireSameScope(provenance, memory);
  requireSameScope(provenance, revision);
}

function validateMutationAudits(
  audits: IndexedRecord[],
  ownerId: string,
  namespaceSet: Set<string>,
  actors: Map<string, IndexedRecord>,
  candidates: Map<string, IndexedRecord>,
  candidateProvenance: Map<string, IndexedRecord>,
  decisions: Map<string, IndexedRecord>,
  memories: Map<string, IndexedRecord>,
  revisions: Map<string, IndexedRecord>,
  lifecycleEvents: IndexedRecord[]
): void {
  const proposalAudits = new Map<string, IndexedRecord>();
  const decisionAudits = new Map<string, IndexedRecord>();
  const lifecycleAuditEvents = new Map<string, IndexedRecord>();
  const lifecycleByKey = new Map<string, IndexedRecord>();
  for (const event of lifecycleEvents) {
    const operation =
      requiredString(event, "eventType") === "correction"
        ? "correct_trusted_memory"
        : "revoke_trusted_memory";
    const key = lifecycleKey(
      operation,
      requiredString(event, "memoryId"),
      requiredString(event, "expectedRevisionId"),
      requiredString(event, "resultingRevisionId")
    );
    if (lifecycleByKey.has(key)) invalid();
    lifecycleByKey.set(key, event);
  }
  for (const audit of audits) {
    requireOwner(audit, ownerId);
    const namespaceId = nullableString(audit, "namespaceId");
    if (namespaceId !== null && !namespaceSet.has(namespaceId)) invalid();
    const actorId = nullableString(audit, "actorIdentityId");
    if (actorId !== null) requireActor(actors, actorId, ownerId);
    const operation = requiredString(audit, "operation");
    const metadata = requiredObject(audit, "metadata");
    if (operation === "propose_memory_candidate") {
      const candidateId = requiredString(metadata, "candidateId");
      const candidate = candidates.get(candidateId);
      const provenance = candidateProvenance.get(candidateId);
      if (
        !candidate ||
        !provenance ||
        namespaceId !== requiredString(candidate, "namespaceId") ||
        actorId !== requiredString(candidate, "proposedByActorId") ||
        requiredNumber(metadata, "contentByteCount") !==
          requiredNumber(candidate, "contentByteCount") ||
        requiredString(metadata, "provenanceKind") !==
          requiredString(provenance, "provenanceKind") ||
        time(requiredString(audit, "occurredAt")) <
          time(requiredString(candidate, "createdAt")) ||
        proposalAudits.has(candidateId)
      ) {
        invalid();
      }
      proposalAudits.set(candidateId, audit);
    } else if (operation === "decide_memory_candidate") {
      const candidateId = requiredString(metadata, "candidateId");
      const candidate = candidates.get(candidateId);
      const decision = decisions.get(candidateId);
      if (
        !candidate ||
        !decision ||
        namespaceId !== requiredString(candidate, "namespaceId") ||
        actorId !== requiredString(decision, "decidedByActorId") ||
        requiredString(metadata, "state") !==
          requiredString(candidate, "state") ||
        requiredBoolean(metadata, "trustedMemoryCreated") !==
          (requiredString(decision, "decision") === "approve") ||
        time(requiredString(audit, "occurredAt")) <
          time(requiredString(decision, "decidedAt")) ||
        decisionAudits.has(candidateId)
      ) {
        invalid();
      }
      decisionAudits.set(candidateId, audit);
    } else if (
      operation === "correct_trusted_memory" ||
      operation === "revoke_trusted_memory"
    ) {
      const memoryId = requiredString(metadata, "memoryId");
      const expectedRevisionId = requiredString(
        metadata,
        "expectedRevisionId"
      );
      const resultingRevisionId = requiredString(
        metadata,
        "resultingRevisionId"
      );
      const key = lifecycleKey(
        operation,
        memoryId,
        expectedRevisionId,
        resultingRevisionId
      );
      const event = lifecycleByKey.get(key);
      if (
        !memories.has(memoryId) ||
        !revisions.has(expectedRevisionId) ||
        !revisions.has(resultingRevisionId) ||
        !event ||
        namespaceId !== requiredString(event, "namespaceId") ||
        actorId !== requiredString(event, "actorIdentityId") ||
        requiredString(metadata, "lifecycleState") !==
          (operation === "correct_trusted_memory" ? "active" : "revoked") ||
        time(requiredString(audit, "occurredAt")) <
          time(requiredString(event, "occurredAt")) ||
        lifecycleAuditEvents.has(key)
      ) {
        invalid();
      }
      lifecycleAuditEvents.set(key, audit);
    }
  }
  if (
    proposalAudits.size !== candidates.size ||
    [...candidates.keys()].some(
      (candidateId) => !proposalAudits.has(candidateId)
    ) ||
    decisionAudits.size !== decisions.size ||
    [...decisions.keys()].some(
      (candidateId) => !decisionAudits.has(candidateId)
    )
  ) {
    invalid();
  }
  if (
    lifecycleAuditEvents.size !== lifecycleByKey.size ||
    [...lifecycleByKey.keys()].some(
      (key) => !lifecycleAuditEvents.has(key)
    )
  ) invalid();
}

function lifecycleKey(
  operation: string,
  memoryId: string,
  expectedRevisionId: string,
  resultingRevisionId: string
): string {
  return `${operation}:${memoryId}:${expectedRevisionId}:${resultingRevisionId}`;
}

function validatePriorReferenceShape(record: IndexedRecord): void {
  const kind = requiredString(record, "provenanceKind");
  const assertion = nullableString(record, "ownerAssertion");
  const priorMemoryId = nullableString(record, "priorMemoryId");
  const priorRevisionId = nullableString(record, "priorRevisionId");
  if (
    (kind === "owner_assertion" &&
      (assertion === null ||
        priorMemoryId !== null ||
        priorRevisionId !== null)) ||
    (kind !== "owner_assertion" &&
      (assertion !== null ||
        priorMemoryId === null ||
        priorRevisionId === null))
  ) {
    invalid();
  }
}

function sameProvenancePayload(
  left: IndexedRecord,
  right: IndexedRecord
): boolean {
  return (
    requiredString(left, "provenanceKind") ===
      requiredString(right, "provenanceKind") &&
    nullableString(left, "ownerAssertion") ===
      nullableString(right, "ownerAssertion") &&
    nullableString(left, "priorMemoryId") ===
      nullableString(right, "priorMemoryId") &&
    nullableString(left, "priorRevisionId") ===
      nullableString(right, "priorRevisionId")
  );
}

function indexBy(
  records: IndexedRecord[],
  field: string
): Map<string, IndexedRecord> {
  const index = new Map<string, IndexedRecord>();
  for (const record of records) {
    const key = requiredString(record, field);
    if (index.has(key)) invalid();
    index.set(key, record);
  }
  return index;
}

function groupBy(
  records: IndexedRecord[],
  field: string
): Map<string, IndexedRecord[]> {
  const groups = new Map<string, IndexedRecord[]>();
  for (const record of records) {
    const key = requiredString(record, field);
    const current = groups.get(key) ?? [];
    current.push(record);
    groups.set(key, current);
  }
  return groups;
}

function requireScope(
  record: IndexedRecord,
  ownerId: string,
  namespaceIds: Set<string>
): void {
  requireOwner(record, ownerId);
  if (!namespaceIds.has(requiredString(record, "namespaceId"))) invalid();
}

function requireOwner(record: IndexedRecord, ownerId: string): void {
  if (requiredString(record, "ownerId") !== ownerId) invalid();
}

function requireSameScope(
  left: IndexedRecord,
  right: IndexedRecord
): void {
  if (
    requiredString(left, "ownerId") !== requiredString(right, "ownerId") ||
    requiredString(left, "namespaceId") !==
      requiredString(right, "namespaceId")
  ) {
    invalid();
  }
}

function requireActor(
  actors: Map<string, IndexedRecord>,
  actorId: string,
  ownerId: string
): void {
  const actor = actors.get(actorId);
  if (!actor || requiredString(actor, "ownerId") !== ownerId) invalid();
}

function requiredString(
  record: IndexedRecord,
  field: string
): string {
  const value = record[field];
  if (typeof value !== "string") invalid();
  return value;
}

function nullableString(
  record: IndexedRecord,
  field: string
): string | null {
  const value = record[field];
  if (value !== null && typeof value !== "string") invalid();
  return value;
}

function requiredNumber(
  record: IndexedRecord,
  field: string
): number {
  const value = record[field];
  if (!Number.isSafeInteger(value)) invalid();
  return value as number;
}

function requiredBoolean(
  record: IndexedRecord,
  field: string
): boolean {
  const value = record[field];
  if (typeof value !== "boolean") invalid();
  return value;
}

function requiredObject(
  record: IndexedRecord,
  field: string
): IndexedRecord {
  const value = record[field];
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as IndexedRecord;
}

function time(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) invalid();
  return parsed;
}

function assertRecordsAtOrBeforeSnapshot(
  sections: ParsedPortableBundle["sections"],
  snapshotCutoff: number
): void {
  assertSectionTimestamps(sections.namespaces, ["createdAt"], snapshotCutoff);
  assertSectionTimestamps(sections.actors, ["createdAt"], snapshotCutoff);
  assertSectionTimestamps(
    sections.candidates,
    ["createdAt", "updatedAt", "decidedAt"],
    snapshotCutoff
  );
  assertSectionTimestamps(
    sections.candidateProvenance,
    ["createdAt"],
    snapshotCutoff
  );
  assertSectionTimestamps(
    sections.candidateDecisions,
    ["decidedAt"],
    snapshotCutoff
  );
  assertSectionTimestamps(sections.memories, ["createdAt"], snapshotCutoff);
  assertSectionTimestamps(sections.revisions, ["createdAt"], snapshotCutoff);
  assertSectionTimestamps(
    sections.trustedProvenance,
    ["createdAt"],
    snapshotCutoff
  );
  assertSectionTimestamps(
    sections.lifecycleEvents,
    ["occurredAt"],
    snapshotCutoff
  );
  assertSectionTimestamps(
    sections.mutationAudits,
    ["occurredAt"],
    snapshotCutoff
  );
}

function assertSectionTimestamps(
  records: IndexedRecord[],
  fields: string[],
  snapshotCutoff: number
): void {
  for (const record of records) {
    for (const field of fields) {
      const value = record[field];
      if (value === null) continue;
      if (typeof value !== "string" || time(value) > snapshotCutoff) invalid();
    }
  }
}

function invalid(): never {
  throw new Error("portable_state_invalid");
}
