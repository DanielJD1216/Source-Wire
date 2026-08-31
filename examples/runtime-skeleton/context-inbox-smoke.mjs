import {
  createRuntimeSkeletonContextInboxState,
  searchRuntimeSkeletonContextInbox,
  transitionRuntimeSkeletonContextCapture
} from "../../dist/index.js";

const caller = {
  callerId: "caller_demo_mcp_capture",
  ownerId: "owner_demo_alpha",
  kind: "mcp_tool",
  allowedNamespaceIds: ["ns_demo_project_alpha"],
  capabilities: ["import_or_maintain_sources"]
};

const request = {
  requestId: "req_demo_context_state_001",
  tool: "capture_context",
  namespaceId: "ns_demo_project_alpha",
  envelope: {
    envelopeId: "env_demo_slack_carrie_001",
    sourceKind: "slack",
    sourceRecordId: "message_demo_carrie_001",
    sourceRevision: "1",
    title: "Synthetic delivery request",
    sourceLocator: "synthetic://slack/project-alpha/message-demo-carrie-001",
    sourceOccurredAt: "2026-08-04T17:00:00.000Z",
    capturedAt: "2026-08-04T23:30:00.000Z",
    sensitivity: "internal",
    content: "Synthetic context: Carrie asked for the revised proposal by tomorrow.",
    fixtureSafety: "synthetic",
    instructionAuthority: "none"
  }
};

const initialState = createRuntimeSkeletonContextInboxState();
const capture = transitionRuntimeSkeletonContextCapture(initialState, caller, request);

assertEqual(initialState.entries.length, 0, "initial state remains unchanged");
assertEqual(capture.status, "allowed", "capture status");
assertEqual(capture.captureDisposition, "appended", "capture disposition");
assertEqual(capture.state.entries.length, 1, "one source entry appended");
assertEqual(capture.state.entries[0].ownerId, caller.ownerId, "owner comes from authenticated caller");
assertEqual(capture.state.entries[0].namespaceId, request.namespaceId, "namespace comes from policy request");
assertEqual(capture.state.entries[0].sourceRecordId, request.envelope.sourceRecordId, "source identity preserved");
assertEqual(capture.state.entries[0].contentDigest, capture.contentDigest, "server-derived digest preserved");
assertEqual(capture.state.synchronizedThrough, request.envelope.capturedAt, "freshness cutoff preserved");
assertEqual(capture.pendingCandidateCreated, false, "no pending candidate created");
assertEqual(capture.trustedMemoryCreated, false, "no trusted memory created");
assertEqual(capture.noAutoPromotion, true, "no automatic promotion");
assertEqual(Object.isFrozen(capture.state), true, "state is frozen");
assertEqual(Object.isFrozen(capture.state.entries), true, "entry list is frozen");
assertEqual(Object.isFrozen(capture.state.entries[0]), true, "entry is frozen");
assertEqual(Object.isFrozen(capture.citations), true, "capture citations are frozen");
assertEqual(Object.isFrozen(capture.citations[0]), true, "capture citation is frozen");
assertEqual(
  Object.hasOwn(capture.state.entries[0], "content"),
  false,
  "retained entry excludes source body"
);
assertEqual(
  JSON.stringify(capture.state).includes(request.envelope.content),
  false,
  "retained state excludes source body"
);

const exactReplay = transitionRuntimeSkeletonContextCapture(capture.state, caller, request);
assertEqual(exactReplay.status, "allowed", "exact replay status");
assertEqual(exactReplay.captureDisposition, "idempotent", "exact replay disposition");
assertEqual(exactReplay.state.entries.length, 1, "exact replay does not duplicate source revision");
assertEqual(exactReplay.state, capture.state, "exact replay preserves the existing state object");

const recaptureRequest = {
  ...request,
  requestId: "req_demo_context_recapture_001",
  envelope: {
    ...request.envelope,
    envelopeId: "env_demo_slack_carrie_recapture_001",
    capturedAt: "2026-08-05T00:00:00.000Z"
  }
};
const recapture = transitionRuntimeSkeletonContextCapture(capture.state, caller, recaptureRequest);
assertEqual(recapture.status, "allowed", "same revision recapture status");
assertEqual(recapture.captureDisposition, "idempotent", "same revision recapture disposition");
assertEqual(recapture.state, capture.state, "same revision recapture preserves state");
assertEqual(recapture.citations, capture.citations, "same revision recapture returns stored citation");
assertEqual(recapture.contentDigest, capture.contentDigest, "same revision recapture returns stored content digest");
assertEqual(recapture.envelopeDigest, capture.envelopeDigest, "same revision recapture returns stored envelope digest");
assertEqual(
  recapture.synchronizedThrough,
  capture.synchronizedThrough,
  "same revision recapture returns stored freshness cutoff"
);

const historicalCaptureRequest = {
  ...request,
  requestId: "req_demo_context_historical_001",
  envelope: {
    ...request.envelope,
    envelopeId: "env_demo_slack_historical_001",
    sourceRecordId: "message_demo_historical_001",
    sourceRevision: "1",
    title: "Synthetic historical delivery request",
    sourceLocator: "synthetic://slack/project-alpha/message-demo-historical-001",
    sourceOccurredAt: "2026-08-03T19:00:00.000Z",
    capturedAt: "2026-08-04T20:00:00.000Z",
    content: "Synthetic context: an older source was captured after newer inbox evidence."
  }
};
const historicalCapture = transitionRuntimeSkeletonContextCapture(
  capture.state,
  caller,
  historicalCaptureRequest
);
assertEqual(historicalCapture.status, "allowed", "historical capture status");
assertEqual(historicalCapture.captureDisposition, "appended", "historical capture disposition");
assertEqual(historicalCapture.state.entries.length, 2, "historical capture appends one entry");
assertEqual(
  historicalCapture.state.synchronizedThrough,
  capture.state.synchronizedThrough,
  "historical capture preserves the latest state freshness cutoff"
);
assertEqual(
  historicalCapture.synchronizedThrough,
  historicalCapture.state.synchronizedThrough,
  "historical capture receipt matches the state freshness cutoff"
);

const historicalReplay = transitionRuntimeSkeletonContextCapture(
  historicalCapture.state,
  caller,
  historicalCaptureRequest
);
assertEqual(historicalReplay.status, "allowed", "historical replay status");
assertEqual(historicalReplay.captureDisposition, "idempotent", "historical replay disposition");
assertEqual(
  historicalReplay.synchronizedThrough,
  capture.synchronizedThrough,
  "historical replay preserves scoped monotonic freshness"
);

const crossBoundReplayCases = [
  {
    caseId: "request match cannot mask envelope conflict",
    request: {
      ...request,
      envelope: {
        ...request.envelope,
        envelopeId: historicalCaptureRequest.envelope.envelopeId
      }
    }
  },
  {
    caseId: "source revision match cannot mask envelope conflict",
    request: {
      ...request,
      requestId: "req_demo_context_cross_bound_revision_001",
      envelope: {
        ...request.envelope,
        envelopeId: historicalCaptureRequest.envelope.envelopeId
      }
    }
  }
];
for (const crossBoundReplayCase of crossBoundReplayCases) {
  const crossBoundReplay = transitionRuntimeSkeletonContextCapture(
    historicalCapture.state,
    caller,
    crossBoundReplayCase.request
  );
  assertEqual(crossBoundReplay.status, "denied", `${crossBoundReplayCase.caseId} status`);
  assertEqual(
    crossBoundReplay.denialReason,
    "envelope_id_conflict",
    `${crossBoundReplayCase.caseId} denial`
  );
  assertEqual(
    crossBoundReplay.state,
    historicalCapture.state,
    `${crossBoundReplayCase.caseId} preserves state`
  );
}

const otherScopeCaller = {
  ...caller,
  callerId: "caller_demo_mcp_capture_beta",
  ownerId: "owner_demo_beta",
  allowedNamespaceIds: ["ns_demo_project_beta"]
};
const otherScopeRequest = {
  ...historicalCaptureRequest,
  requestId: "req_demo_context_other_scope_001",
  namespaceId: "ns_demo_project_beta",
  envelope: {
    ...historicalCaptureRequest.envelope,
    envelopeId: "env_demo_context_other_scope_001",
    sourceRecordId: "message_demo_other_scope_001",
    sourceLocator: "synthetic://slack/project-beta/message-demo-other-scope-001"
  }
};
const crossScopeCapture = transitionRuntimeSkeletonContextCapture(
  capture.state,
  otherScopeCaller,
  otherScopeRequest
);
assertEqual(crossScopeCapture.status, "denied", "cross-scope capture state status");
assertEqual(
  crossScopeCapture.denialReason,
  "context_inbox_state_invalid",
  "cross-scope capture state denial"
);
assertEqual(crossScopeCapture.state.entries, [], "cross-scope capture returns no foreign state");

const otherScopeCapture = transitionRuntimeSkeletonContextCapture(
  createRuntimeSkeletonContextInboxState(),
  otherScopeCaller,
  otherScopeRequest
);
assertEqual(otherScopeCapture.status, "allowed", "other scope capture status");
assertEqual(
  otherScopeCapture.synchronizedThrough,
  otherScopeRequest.envelope.capturedAt,
  "capture receipt exposes only owner and namespace scoped freshness"
);
assertEqual(
  otherScopeCapture.state.synchronizedThrough,
  otherScopeRequest.envelope.capturedAt,
  "capture state freshness remains scoped"
);

const mutableValidState = JSON.parse(JSON.stringify(capture.state));
const mutableStateCapture = transitionRuntimeSkeletonContextCapture(
  mutableValidState,
  caller,
  historicalCaptureRequest
);
assertEqual(mutableStateCapture.status, "allowed", "mutable valid state capture status");
assertEqual(
  mutableStateCapture.state.entries[0] === mutableValidState.entries[0],
  false,
  "accepted mutable entry is cloned"
);
assertEqual(
  Object.isFrozen(mutableStateCapture.state.entries[0]),
  true,
  "accepted mutable entry is frozen"
);
assertEqual(
  Object.isFrozen(mutableStateCapture.state.entries[0].citation),
  true,
  "accepted mutable citation is frozen"
);

const searchCaller = {
  ...caller,
  callerId: "caller_demo_mcp_context_search",
  capabilities: ["read_source_evidence"]
};
const searchRequest = {
  requestId: "req_demo_context_search_001",
  tool: "search_source_evidence",
  namespaceId: request.namespaceId,
  query: "Find the synthetic delivery request."
};
const search = searchRuntimeSkeletonContextInbox(capture.state, searchCaller, searchRequest);
assertEqual(search.status, "allowed", "context search status");
assertEqual(search.sourceEvidenceReturned, true, "context search returns source evidence");
assertEqual(search.trustedMemoryReturned, false, "context search returns no trusted memory");
assertEqual(search.contextEvidence.length, 1, "context search returns one captured entry");
assertEqual(search.contextEvidence[0].sourceRecordId, request.envelope.sourceRecordId, "search source identity");
assertEqual(search.contextEvidence[0].sourceRevision, request.envelope.sourceRevision, "search source revision");
assertEqual(search.contextEvidence[0].contentDigest, capture.contentDigest, "search content digest");
assertEqual(search.contextEvidence[0].envelopeDigest, capture.envelopeDigest, "search envelope digest");
assertEqual(search.citations, capture.citations, "search citation");
assertEqual(Object.isFrozen(search.citations), true, "search citations are frozen");
assertEqual(Object.isFrozen(search.citations[0]), true, "search citation is frozen");
assertEqual(search.synchronizedThrough, request.envelope.capturedAt, "search freshness cutoff");
assertEqual(search.pendingCandidateCreated, false, "context search creates no pending candidate");
assertEqual(search.trustedMemoryCreated, false, "context search creates no trusted memory");
assertEqual(search.noAutoPromotion, true, "context search cannot auto-promote");
assertEqual(Object.hasOwn(search.contextEvidence[0], "ownerId"), false, "search excludes owner authority");
assertEqual(Object.hasOwn(search.contextEvidence[0], "captureRequestId"), false, "search excludes capture request identity");
assertEqual(Object.hasOwn(search.contextEvidence[0], "content"), false, "search excludes source body");
assertEqual(JSON.stringify(search).includes(request.envelope.content), false, "search response excludes source body");

const forgedState = {
  ...capture.state,
  entries: [
    {
      ...capture.state.entries[0],
      content: "Synthetic secret that must never cross the source-only retrieval boundary."
    }
  ]
};
const forgedStateSearch = searchRuntimeSkeletonContextInbox(
  forgedState,
  searchCaller,
  { ...searchRequest, requestId: "req_demo_context_search_forged_state_001" }
);
assertEqual(forgedStateSearch.status, "denied", "forged state search status");
assertEqual(forgedStateSearch.denialReason, "context_inbox_state_invalid", "forged state search denial");
assertEqual(forgedStateSearch.sourceEvidenceReturned, false, "forged state returns no source evidence");
assertEqual(forgedStateSearch.contextEvidence, [], "forged state returns no context entries");
assertEqual(forgedStateSearch.citations, [], "forged state returns no citations");
assertEqual(
  JSON.stringify(forgedStateSearch).includes(forgedState.entries[0].content),
  false,
  "forged state cannot leak an extra source body"
);

const ownerlessForgedStateSearch = searchRuntimeSkeletonContextInbox(
  forgedState,
  { ...searchCaller, callerId: "caller_demo_ownerless_forged_state", ownerId: undefined },
  { ...searchRequest, requestId: "req_demo_context_search_ownerless_forged_state_001" }
);
assertEqual(ownerlessForgedStateSearch.status, "denied", "ownerless forged state search status");
assertEqual(
  ownerlessForgedStateSearch.denialReason,
  "authenticated_owner_required",
  "owner policy precedes state validation"
);
assertEqual(ownerlessForgedStateSearch.contextEvidence, [], "ownerless forged state returns no entries");

const forgedStateCapture = transitionRuntimeSkeletonContextCapture(
  forgedState,
  caller,
  {
    ...historicalCaptureRequest,
    requestId: "req_demo_context_capture_forged_state_001",
    envelope: {
      ...historicalCaptureRequest.envelope,
      envelopeId: "env_demo_context_capture_forged_state_001",
      sourceRecordId: "message_demo_context_capture_forged_state_001",
      sourceLocator: "synthetic://slack/project-alpha/capture-forged-state"
    }
  }
);
assertEqual(forgedStateCapture.status, "denied", "forged state capture status");
assertEqual(forgedStateCapture.denialReason, "context_inbox_state_invalid", "forged state capture denial");
assertEqual(forgedStateCapture.contextCaptured, false, "forged state capture appends nothing");
assertEqual(forgedStateCapture.state.entries, [], "forged state capture returns sanitized empty state");
assertEqual(forgedStateCapture.citations, [], "forged state capture returns no citations");
assertEqual(
  JSON.stringify(forgedStateCapture).includes(forgedState.entries[0].content),
  false,
  "forged state capture cannot reflect an extra source body"
);

const hiddenContentEntry = Object.freeze(
  Object.defineProperty({ ...capture.state.entries[0] }, "content", {
    value: "Synthetic hidden source body.",
    enumerable: false
  })
);
const hiddenContentState = Object.freeze({
  contractVersion: "source-wire.context-inbox-state.v1",
  entries: Object.freeze([hiddenContentEntry]),
  synchronizedThrough: capture.state.synchronizedThrough
});
const hiddenContentCapture = transitionRuntimeSkeletonContextCapture(
  hiddenContentState,
  caller,
  request
);
assertEqual(hiddenContentCapture.status, "denied", "hidden state property capture status");
assertEqual(
  hiddenContentCapture.denialReason,
  "context_inbox_state_invalid",
  "hidden state property capture denial"
);
assertEqual(hiddenContentCapture.state.entries, [], "hidden state property is not retained");

const revokedState = Proxy.revocable({}, {});
revokedState.revoke();
let revokedStateCapture;
try {
  revokedStateCapture = transitionRuntimeSkeletonContextCapture(
    revokedState.proxy,
    caller,
    historicalCaptureRequest
  );
} catch {
  revokedStateCapture = { status: "threw" };
}
assertEqual(revokedStateCapture.status, "denied", "revoked proxy state fails closed");
assertEqual(
  revokedStateCapture.denialReason,
  "context_inbox_state_invalid",
  "revoked proxy state denial"
);

const transparentProxyStateCapture = transitionRuntimeSkeletonContextCapture(
  new Proxy(capture.state, {}),
  caller,
  historicalCaptureRequest
);
assertEqual(transparentProxyStateCapture.status, "denied", "transparent proxy state fails closed");
assertEqual(
  transparentProxyStateCapture.denialReason,
  "context_inbox_state_invalid",
  "transparent proxy state denial"
);
assertEqual(transparentProxyStateCapture.state.entries, [], "transparent proxy returns sanitized state");

const baseReplayEntry = capture.state.entries[0];
const uniqueReplayEntry = {
  ...baseReplayEntry,
  captureRequestId: "req_demo_duplicate_secondary_001",
  envelopeId: "env_demo_duplicate_secondary_001",
  sourceRecordId: "message_demo_duplicate_secondary_001",
  sourceRevision: "1",
  title: "Synthetic duplicate replay state",
  sourceLocator: "synthetic://slack/project-alpha/duplicate-secondary-001",
  contentDigest: "a".repeat(64),
  envelopeDigest: "b".repeat(64),
  citation: {
    evidenceKind: "source_evidence",
    sourceId: "message_demo_duplicate_secondary_001",
    segmentId: "env_demo_duplicate_secondary_001",
    address: "synthetic://slack/project-alpha/duplicate-secondary-001"
  }
};

let accessorRequestReads = 0;
const accessorEntry = { ...uniqueReplayEntry };
Object.defineProperty(accessorEntry, "captureRequestId", {
  enumerable: true,
  configurable: true,
  get() {
    accessorRequestReads += 1;
    return accessorRequestReads < 3
      ? `req_demo_accessor_unique_${accessorRequestReads}`
      : baseReplayEntry.captureRequestId;
  }
});
const accessorStateCapture = transitionRuntimeSkeletonContextCapture(
  {
    contractVersion: "source-wire.context-inbox-state.v1",
    entries: [baseReplayEntry, accessorEntry],
    synchronizedThrough: capture.state.synchronizedThrough
  },
  caller,
  historicalCaptureRequest
);
assertEqual(accessorStateCapture.status, "denied", "accessor state capture status");
assertEqual(
  accessorStateCapture.denialReason,
  "context_inbox_state_invalid",
  "accessor state capture denial"
);
assertEqual(accessorStateCapture.state.entries, [], "accessor state cannot materialize duplicates");

const duplicateReplayStates = [
  {
    caseId: "duplicate request identity",
    entry: { ...uniqueReplayEntry, captureRequestId: baseReplayEntry.captureRequestId }
  },
  {
    caseId: "duplicate envelope identity",
    entry: {
      ...uniqueReplayEntry,
      envelopeId: baseReplayEntry.envelopeId,
      citation: { ...uniqueReplayEntry.citation, segmentId: baseReplayEntry.envelopeId }
    }
  },
  {
    caseId: "duplicate source revision",
    entry: {
      ...uniqueReplayEntry,
      sourceRecordId: baseReplayEntry.sourceRecordId,
      sourceRevision: baseReplayEntry.sourceRevision,
      citation: { ...uniqueReplayEntry.citation, sourceId: baseReplayEntry.sourceRecordId }
    }
  }
];

for (const [index, duplicateReplayState] of duplicateReplayStates.entries()) {
  const duplicateStateSearch = searchRuntimeSkeletonContextInbox(
    {
      contractVersion: "source-wire.context-inbox-state.v1",
      entries: [baseReplayEntry, duplicateReplayState.entry],
      synchronizedThrough: capture.state.synchronizedThrough
    },
    searchCaller,
    { ...searchRequest, requestId: `req_demo_duplicate_state_search_${index + 1}` }
  );
  assertEqual(duplicateStateSearch.status, "denied", `${duplicateReplayState.caseId} status`);
  assertEqual(
    duplicateStateSearch.denialReason,
    "context_inbox_state_invalid",
    `${duplicateReplayState.caseId} denial`
  );
  assertEqual(duplicateStateSearch.contextEvidence, [], `${duplicateReplayState.caseId} returns no entries`);
}

const otherOwnerSearch = searchRuntimeSkeletonContextInbox(
  capture.state,
  { ...searchCaller, callerId: "caller_demo_other_owner", ownerId: "owner_demo_beta" },
  { ...searchRequest, requestId: "req_demo_context_search_other_owner_001" }
);
assertEqual(otherOwnerSearch.status, "allowed", "other owner search policy status");
assertEqual(otherOwnerSearch.sourceEvidenceReturned, false, "other owner sees no source evidence");
assertEqual(otherOwnerSearch.contextEvidence.length, 0, "other owner sees no context entries");
assertEqual(otherOwnerSearch.citations, [], "other owner sees no citations");
assertEqual(otherOwnerSearch.synchronizedThrough, undefined, "other owner sees no freshness cutoff");

const searchWithoutOwner = searchRuntimeSkeletonContextInbox(
  capture.state,
  { ...searchCaller, callerId: "caller_demo_search_without_owner", ownerId: undefined },
  { ...searchRequest, requestId: "req_demo_context_search_without_owner_001" }
);
assertEqual(searchWithoutOwner.status, "denied", "ownerless context search status");
assertEqual(searchWithoutOwner.denialReason, "authenticated_owner_required", "ownerless context search denial");
assertEqual(searchWithoutOwner.contextEvidence.length, 0, "ownerless context search returns no entries");
assertEqual(searchWithoutOwner.citations, [], "ownerless context search returns no citations");

const wrongNamespaceSearch = searchRuntimeSkeletonContextInbox(
  capture.state,
  searchCaller,
  {
    ...searchRequest,
    requestId: "req_demo_context_search_wrong_namespace_001",
    namespaceId: "ns_demo_client_beta"
  }
);
assertEqual(wrongNamespaceSearch.status, "denied", "wrong namespace context search status");
assertEqual(wrongNamespaceSearch.denialReason, "namespace_not_allowed", "wrong namespace context search denial");
assertEqual(wrongNamespaceSearch.contextEvidence.length, 0, "wrong namespace context search returns no entries");
assertEqual(wrongNamespaceSearch.citations, [], "wrong namespace context search returns no citations");

const missingCapabilitySearch = searchRuntimeSkeletonContextInbox(
  capture.state,
  { ...searchCaller, callerId: "caller_demo_search_without_capability", capabilities: [] },
  { ...searchRequest, requestId: "req_demo_context_search_without_capability_001" }
);
assertEqual(missingCapabilitySearch.status, "denied", "missing capability context search status");
assertEqual(
  missingCapabilitySearch.denialReason,
  "missing_read_source_evidence_capability",
  "missing capability context search denial"
);
assertEqual(missingCapabilitySearch.contextEvidence.length, 0, "missing capability context search returns no entries");
assertEqual(missingCapabilitySearch.citations, [], "missing capability context search returns no citations");
assertEqual(capture.state.entries.length, 1, "context search denial paths do not mutate state");

const wrongNamespaceCapture = transitionRuntimeSkeletonContextCapture(
  capture.state,
  caller,
  {
    ...request,
    requestId: "req_demo_context_wrong_namespace_001",
    namespaceId: "ns_demo_client_beta",
    envelope: { ...request.envelope, sourceLocator: "https://invalid.example/context" }
  }
);
assertEqual(wrongNamespaceCapture.status, "denied", "wrong namespace capture status");
assertEqual(wrongNamespaceCapture.denialReason, "namespace_not_allowed", "namespace checked before validation");
assertEqual(wrongNamespaceCapture.state, capture.state, "wrong namespace capture preserves state");

const missingCapabilityCapture = transitionRuntimeSkeletonContextCapture(
  capture.state,
  { ...caller, callerId: "caller_demo_capture_without_capability", capabilities: [] },
  {
    ...request,
    requestId: "req_demo_context_missing_capability_001",
    envelope: { ...request.envelope, sourceLocator: "https://invalid.example/context" }
  }
);
assertEqual(missingCapabilityCapture.status, "denied", "missing capability capture status");
assertEqual(
  missingCapabilityCapture.denialReason,
  "missing_import_or_maintain_sources_capability",
  "capability checked before validation"
);
assertEqual(missingCapabilityCapture.state, capture.state, "missing capability capture preserves state");

const ownerlessCapture = transitionRuntimeSkeletonContextCapture(
  capture.state,
  { ...caller, callerId: "caller_demo_capture_without_owner", ownerId: undefined },
  {
    ...request,
    requestId: "req_demo_context_missing_owner_001",
    envelope: { ...request.envelope, sourceLocator: "https://invalid.example/context" }
  }
);
assertEqual(ownerlessCapture.status, "denied", "ownerless capture status");
assertEqual(ownerlessCapture.denialReason, "authenticated_owner_required", "owner checked before validation");
assertEqual(ownerlessCapture.state, capture.state, "ownerless capture preserves state");

const ownerlessForgedStateCapture = transitionRuntimeSkeletonContextCapture(
  forgedState,
  { ...caller, callerId: "caller_demo_ownerless_forged_capture", ownerId: undefined },
  { ...request, requestId: "req_demo_context_ownerless_forged_capture_001" }
);
assertEqual(ownerlessForgedStateCapture.status, "denied", "ownerless forged capture status");
assertEqual(
  ownerlessForgedStateCapture.denialReason,
  "authenticated_owner_required",
  "capture authorization precedes state validation"
);
assertEqual(
  ownerlessForgedStateCapture.state === forgedState,
  true,
  "ownerless forged capture does not inspect or sanitize state"
);

const invalidIdentityCases = [
  {
    caseId: "whitespace owner",
    caller: { ...caller, callerId: "caller_demo_whitespace_owner", ownerId: " " },
    request: { ...request, requestId: "req_demo_context_whitespace_owner_001" },
    denialReason: "authenticated_owner_required"
  },
  {
    caseId: "malformed namespace",
    caller: {
      ...caller,
      callerId: "caller_demo_malformed_namespace",
      allowedNamespaceIds: [" "]
    },
    request: { ...request, requestId: "req_demo_context_malformed_namespace_001", namespaceId: " " },
    denialReason: "context_capture_identity_invalid"
  },
  {
    caseId: "malformed request identity",
    caller,
    request: { ...request, requestId: " " },
    denialReason: "context_capture_identity_invalid"
  }
];

for (const invalidIdentity of invalidIdentityCases) {
  const invalidIdentityCapture = transitionRuntimeSkeletonContextCapture(
    capture.state,
    invalidIdentity.caller,
    invalidIdentity.request
  );
  assertEqual(invalidIdentityCapture.status, "denied", `${invalidIdentity.caseId} status`);
  assertEqual(
    invalidIdentityCapture.denialReason,
    invalidIdentity.denialReason,
    `${invalidIdentity.caseId} denial`
  );
  assertEqual(invalidIdentityCapture.state, capture.state, `${invalidIdentity.caseId} preserves state`);
  assertEqual(invalidIdentityCapture.state.entries.length, 1, `${invalidIdentity.caseId} appends nothing`);
}

const accessorEnvelope = { ...request.envelope };
Object.defineProperty(accessorEnvelope, "content", {
  enumerable: true,
  configurable: true,
  get() {
    return request.envelope.content;
  }
});
const accessorEnvelopeCapture = transitionRuntimeSkeletonContextCapture(capture.state, caller, {
  ...request,
  requestId: "req_demo_context_accessor_envelope_001",
  envelope: accessorEnvelope
});
assertEqual(accessorEnvelopeCapture.status, "denied", "accessor envelope capture status");
assertEqual(
  accessorEnvelopeCapture.denialReason,
  "context_envelope_invalid",
  "accessor envelope capture denial"
);
assertEqual(accessorEnvelopeCapture.state, capture.state, "accessor envelope preserves state");

const revokedEnvelope = Proxy.revocable({}, {});
revokedEnvelope.revoke();
let revokedEnvelopeCapture;
try {
  revokedEnvelopeCapture = transitionRuntimeSkeletonContextCapture(capture.state, caller, {
    ...request,
    requestId: "req_demo_context_revoked_envelope_001",
    envelope: revokedEnvelope.proxy
  });
} catch {
  revokedEnvelopeCapture = { status: "threw" };
}
assertEqual(revokedEnvelopeCapture.status, "denied", "revoked envelope fails closed");
assertEqual(
  revokedEnvelopeCapture.denialReason,
  "context_envelope_invalid",
  "revoked envelope denial"
);
assertEqual(revokedEnvelopeCapture.state, capture.state, "revoked envelope preserves state");

const transparentProxyEnvelopeCapture = transitionRuntimeSkeletonContextCapture(capture.state, caller, {
  ...request,
  envelope: new Proxy({ ...request.envelope }, {})
});
assertEqual(
  transparentProxyEnvelopeCapture.status,
  "denied",
  "transparent proxy envelope fails closed"
);
assertEqual(
  transparentProxyEnvelopeCapture.denialReason,
  "context_envelope_invalid",
  "transparent proxy envelope denial"
);
assertEqual(
  transparentProxyEnvelopeCapture.state,
  capture.state,
  "transparent proxy envelope preserves state"
);

const invalidEnvelopeCases = [
  {
    caseId: "missing provenance",
    envelope: (({ sourceRecordId: _sourceRecordId, ...envelope }) => envelope)(request.envelope)
  },
  {
    caseId: "malformed captured timestamp",
    envelope: { ...request.envelope, capturedAt: "not-a-timestamp" }
  },
  {
    caseId: "unsafe source locator",
    envelope: { ...request.envelope, sourceLocator: "https://example.com/private-context" }
  },
  {
    caseId: "non-synthetic fixture",
    envelope: { ...request.envelope, fixtureSafety: "real" }
  },
  {
    caseId: "oversized content",
    envelope: { ...request.envelope, content: "x".repeat(65_537) }
  },
  {
    caseId: "instruction authority",
    envelope: { ...request.envelope, instructionAuthority: "instructions" }
  }
];

for (const [index, invalidCase] of invalidEnvelopeCases.entries()) {
  const invalidCapture = transitionRuntimeSkeletonContextCapture(capture.state, caller, {
    ...request,
    requestId: `req_demo_context_invalid_${index + 1}`,
    envelope: invalidCase.envelope
  });
  assertEqual(invalidCapture.status, "denied", `${invalidCase.caseId} status`);
  assertEqual(invalidCapture.denialReason, "context_envelope_invalid", `${invalidCase.caseId} denial`);
  assertEqual(invalidCapture.state, capture.state, `${invalidCase.caseId} preserves state`);
  assertEqual(invalidCapture.citations, [], `${invalidCase.caseId} returns no citation`);
  assertEqual(Object.hasOwn(invalidCapture, "contentDigest"), false, `${invalidCase.caseId} returns no digest`);
}

const metadataConflictRequest = {
  ...request,
  requestId: "req_demo_context_metadata_conflict_001",
  envelope: {
    ...request.envelope,
    sourceLocator: "synthetic://slack/project-alpha/conflicting-locator"
  }
};
const metadataConflict = transitionRuntimeSkeletonContextCapture(
  capture.state,
  caller,
  metadataConflictRequest
);
assertEqual(metadataConflict.status, "denied", "metadata conflict status");
assertEqual(metadataConflict.captureDisposition, "conflict", "metadata conflict disposition");
assertEqual(metadataConflict.denialReason, "source_revision_conflict", "metadata conflict denial");
assertEqual(metadataConflict.state, capture.state, "metadata conflict preserves state");

const requestReplayConflictRequest = {
  ...request,
  envelope: {
    ...request.envelope,
    envelopeId: "env_demo_request_replay_conflict_001",
    sourceRecordId: "message_demo_request_replay_conflict_001",
    sourceRevision: "1",
    sourceLocator: "synthetic://slack/project-alpha/request-replay-conflict",
    content: "Synthetic context: different evidence under a reused request ID."
  }
};
const requestReplayConflict = transitionRuntimeSkeletonContextCapture(
  capture.state,
  caller,
  requestReplayConflictRequest
);
assertEqual(requestReplayConflict.status, "denied", "request replay conflict status");
assertEqual(requestReplayConflict.captureDisposition, "conflict", "request replay conflict disposition");
assertEqual(requestReplayConflict.denialReason, "request_replay_conflict", "request replay conflict denial");
assertEqual(requestReplayConflict.state, capture.state, "request replay conflict preserves state");

const envelopeIdentityConflictRequest = {
  ...request,
  requestId: "req_demo_context_envelope_identity_conflict_001",
  envelope: {
    ...request.envelope,
    sourceRecordId: "message_demo_envelope_identity_conflict_001",
    sourceRevision: "1",
    sourceLocator: "synthetic://slack/project-alpha/envelope-identity-conflict",
    content: "Synthetic context: different evidence under a reused envelope ID."
  }
};
const envelopeIdentityConflict = transitionRuntimeSkeletonContextCapture(
  capture.state,
  caller,
  envelopeIdentityConflictRequest
);
assertEqual(envelopeIdentityConflict.status, "denied", "envelope identity conflict status");
assertEqual(envelopeIdentityConflict.captureDisposition, "conflict", "envelope identity conflict disposition");
assertEqual(envelopeIdentityConflict.denialReason, "envelope_id_conflict", "envelope identity conflict denial");
assertEqual(envelopeIdentityConflict.state, capture.state, "envelope identity conflict preserves state");

const conflictingRequest = {
  ...request,
  requestId: "req_demo_context_state_conflict_001",
  envelope: {
    ...request.envelope,
    content: "Synthetic context: conflicting content for the same source revision."
  }
};
const conflict = transitionRuntimeSkeletonContextCapture(
  capture.state,
  caller,
  conflictingRequest
);
assertEqual(conflict.status, "denied", "conflicting revision status");
assertEqual(conflict.captureDisposition, "conflict", "conflicting revision disposition");
assertEqual(conflict.denialReason, "source_revision_conflict", "conflicting revision denial reason");
assertEqual(conflict.state, capture.state, "conflicting revision preserves state object");
assertEqual(conflict.state.entries.length, 1, "conflicting revision does not mutate state");
assertEqual(
  JSON.stringify(conflict).includes(conflictingRequest.envelope.content),
  false,
  "conflict response does not leak snapshot content"
);

const authorityInjectionRequest = {
  ...request,
  requestId: "req_demo_context_authority_injection_001",
  envelope: {
    ...request.envelope,
    sourceRecordId: "message_demo_authority_injection_001",
    envelopeId: "env_demo_authority_injection_001",
    ownerId: "owner_from_untrusted_source"
  }
};
const authorityInjection = transitionRuntimeSkeletonContextCapture(
  capture.state,
  caller,
  authorityInjectionRequest
);
assertEqual(authorityInjection.status, "denied", "authority injection status");
assertEqual(authorityInjection.denialReason, "context_envelope_invalid", "authority injection denial");
assertEqual(authorityInjection.state, capture.state, "authority injection preserves state");
assertEqual(authorityInjection.state.entries.length, 1, "authority injection appends nothing");

console.log("ok runtime context inbox append-only state transition");
console.log("ok runtime context inbox smoke");

function assertEqual(actual, expected, field) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      [
        "runtime context inbox smoke failed",
        `field: ${field}`,
        `expected: ${JSON.stringify(expected)}`,
        `received: ${JSON.stringify(actual)}`,
        "next action: inspect src/runtime-skeleton/index.ts and examples/runtime-skeleton/context-inbox-smoke.mjs"
      ].join("\n")
    );
  }
}
