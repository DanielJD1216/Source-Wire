import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { types as nodeUtilTypes } from "node:util";

import {
  createRuntimeSkeletonContextInboxState,
  searchRuntimeSkeletonContextInbox,
  transitionRuntimeSkeletonContextCapture
} from "../../dist/index.js";

const corpusUrl = new URL(
  "../fixtures/runtime-skeleton/context-quality-eval-v0.json",
  import.meta.url
);
const replayRequestConflictSourceBody = "Synthetic request conflict body.";
const replayEnvelopeConflictSourceBody = "Synthetic envelope conflict body.";
const replayRevisionConflictSourceBody =
  "Synthetic conflicting content for the same revision.";
const foreignOwnerSourceBody =
  "Synthetic beta body that must never cross owner boundaries.";
const generatedSourceBodies = Object.freeze([
  replayRequestConflictSourceBody,
  replayEnvelopeConflictSourceBody,
  replayRevisionConflictSourceBody,
  foreignOwnerSourceBody
]);
const searchEvidenceKeys = Object.freeze([
  "capturedAt",
  "citation",
  "contentDigest",
  "envelopeDigest",
  "envelopeId",
  "sensitivity",
  "sourceKind",
  "sourceLocator",
  "sourceOccurredAt",
  "sourceRecordId",
  "sourceRevision",
  "title"
]);
const stateEntryKeys = Object.freeze([
  "captureRequestId",
  "capturedAt",
  "citation",
  "contentDigest",
  "envelopeDigest",
  "envelopeId",
  "namespaceId",
  "ownerId",
  "sensitivity",
  "sourceKind",
  "sourceLocator",
  "sourceOccurredAt",
  "sourceRecordId",
  "sourceRevision",
  "title"
]);
const citationKeys = Object.freeze(["address", "evidenceKind", "segmentId", "sourceId"]);
const auditKeys = Object.freeze([
  "action",
  "boundaryPath",
  "callerId",
  "callerKind",
  "leakedContent",
  "namespaceId",
  "privatePathReturned",
  "rawTokenReturned",
  "result"
]);
const baseResultKeys = Object.freeze([
  "audit",
  "citationCount",
  "citations",
  "contextCaptured",
  "gapKinds",
  "namespaceId",
  "noAutoPromotion",
  "omittedCount",
  "pendingCandidateCreated",
  "requestId",
  "runtimeMode",
  "sourceEvidenceReturned",
  "sourceWireHostsUserMemory",
  "status",
  "trustedMemoryCreated",
  "trustedMemoryReturned"
]);
const captureResultKeys = Object.freeze([
  ...baseResultKeys,
  "captureDisposition",
  "contentDigest",
  "envelopeDigest",
  "requiredCapability",
  "state",
  "synchronizedThrough"
]);
const searchResultKeys = Object.freeze([
  ...baseResultKeys,
  "contextEvidence",
  "requiredCapability",
  "synchronizedThrough"
]);
const replayDeniedResultKeys = Object.freeze([
  ...baseResultKeys,
  "captureDisposition",
  "denialReason",
  "requiredCapability",
  "state"
]);
const boundaryResultKeys = Object.freeze([
  ...baseResultKeys,
  "contextEvidence",
  "denialReason",
  "requiredCapability"
]);
const boundaryResultKeysWithoutCapability = Object.freeze(
  boundaryResultKeys.filter((key) => key !== "requiredCapability")
);
const foreignStateBoundaryResultKeys = Object.freeze([
  ...baseResultKeys,
  "denialReason",
  "requiredCapability",
  "state"
]);
const boundaryCasesWithoutCapability = new Set([
  "boundary_hidden_key",
  "boundary_inherited_key",
  "boundary_symbol_key",
  "boundary_accessor",
  "boundary_custom_prototype",
  "boundary_transparent_proxy",
  "boundary_revoked_proxy"
]);
const reportMetricKeys = Object.freeze([
  "retrievalExpectedSetAccuracy",
  "precisionAtK",
  "recallAtK",
  "citationProvenanceFidelity",
  "ownerLeakage",
  "namespaceLeakage",
  "sourceBodyLeakage",
  "unauthorizedCandidateCreation",
  "unauthorizedTrustedMemoryCreation",
  "replayViolations",
  "freshnessViolations",
  "adversarialEscapes",
  "unhandledCases"
]);
const requiredThresholds = Object.freeze({
  retrievalExpectedSetAccuracy: 1,
  precisionAtK: 1,
  recallAtK: 1,
  citationProvenanceFidelity: 1,
  ownerLeakage: 0,
  namespaceLeakage: 0,
  sourceBodyLeakage: 0,
  unauthorizedCandidateCreation: 0,
  unauthorizedTrustedMemoryCreation: 0,
  replayViolations: 0,
  freshnessViolations: 0,
  adversarialEscapes: 0,
  unhandledCases: 0
});
const evaluatedDimensions = Object.freeze([
  "retrieval_quality",
  "citation_and_provenance",
  "freshness_and_revision",
  "authorization_and_isolation",
  "retention_and_response_safety",
  "replay_and_conflict",
  "memory_lifecycle_separation",
  "adversarial_robustness"
]);
const requiredCaseMatrix = Object.freeze({
  captures: Object.freeze([
    "capture_delivery_revision_1",
    "capture_budget_revision_1",
    "capture_delivery_revision_2",
    "capture_historical_revision_1"
  ]),
  searchCases: Object.freeze([
    "search_current_delivery_revision",
    "search_budget_review",
    "search_historical_retrospective",
    "search_broad_synthetic_metadata",
    "search_unanswerable_metadata"
  ]),
  replayCases: Object.freeze([
    "replay_exact_request:exact_replay",
    "replay_legitimate_reobservation:legitimate_reobservation",
    "replay_request_conflict:request_conflict",
    "replay_envelope_conflict:envelope_conflict",
    "replay_source_revision_conflict:source_revision_conflict",
    "replay_matching_request_cannot_mask_envelope_conflict:cross_bound_conflict"
  ]),
  boundaryCases: Object.freeze([
    "boundary_wrong_owner:wrong_owner",
    "boundary_wrong_namespace:wrong_namespace",
    "boundary_missing_capability:missing_capability",
    "boundary_foreign_trusted_state:foreign_trusted_state",
    "boundary_mixed_scope_state:mixed_scope_state",
    "boundary_unknown_key:unknown_key",
    "boundary_hidden_key:hidden_key",
    "boundary_inherited_key:inherited_key",
    "boundary_symbol_key:symbol_key",
    "boundary_accessor:accessor",
    "boundary_own_proto:own_proto",
    "boundary_custom_prototype:custom_prototype",
    "boundary_sparse_array:sparse_array",
    "boundary_custom_array:custom_array",
    "boundary_transparent_proxy:transparent_proxy",
    "boundary_revoked_proxy:revoked_proxy",
    "boundary_malformed_id:malformed_id",
    "boundary_malformed_query:malformed_query",
    "boundary_malformed_state:malformed_state"
  ])
});
const requiredCorpusOracleDigest =
  "5588d51bbc3eb5b28bfb0c2e749ed1d55109a4bcced3e74ae6a2821e772164ce";
const requiredResultProjectionOracleDigest =
  "e92fb8bf7852c152d4b760bbbe8ec9b76170ee04eb205c690084d03d0e7f97f1";
export function collectContextQualityObservations(corpus) {
  validateCorpus(corpus);

  const captureObservations = [];
  const captureByCaseId = new Map();
  let state = createRuntimeSkeletonContextInboxState();
  for (const captureCase of corpus.captures) {
    const result = transitionRuntimeSkeletonContextCapture(
      state,
      corpus.captureCaller,
      captureCase.request
    );
    const observation = {
      caseId: captureCase.caseId,
      handled: true,
      result
    };
    captureObservations.push(observation);
    captureByCaseId.set(captureCase.caseId, observation);
    if (result.status === "allowed") state = result.state;
  }

  const searchObservations = corpus.searchCases.map((searchCase) => ({
    caseId: searchCase.caseId,
    handled: true,
    result: searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, {
      requestId: `req_${searchCase.caseId}`,
      tool: "search_source_evidence",
      namespaceId: corpus.searchCaller.allowedNamespaceIds[0],
      query: searchCase.query
    })
  }));

  const replayObservations = corpus.replayCases.map((replayCase) =>
    collectReplayObservation(corpus, state, replayCase)
  );

  const beta = createForeignTrustedState(corpus);
  const boundaryObservations = corpus.boundaryCases.map((boundaryCase) =>
    collectBoundaryObservation(corpus, state, beta, boundaryCase)
  );

  return Object.freeze({
    captures: Object.freeze(captureObservations),
    searches: Object.freeze(searchObservations),
    replays: Object.freeze(replayObservations),
    boundaries: Object.freeze(boundaryObservations)
  });
}

export function evaluateContextQualityObservations(corpus, observations) {
  validateCorpus(corpus);
  const failures = [];
  const failedCaseIds = new Set();
  const sourceBodies = [
    ...corpus.captures.map((captureCase) => captureCase.request.envelope.content),
    ...generatedSourceBodies
  ];
  const expectedEvidenceById = new Map(
    corpus.captures.map((captureCase) => {
      const evidence = expectedSearchEvidence(captureCase.request);
      return [evidenceId(evidence), evidence];
    })
  );
  const expectedScopedFreshness = corpus.captures.reduce(
    (latest, captureCase) =>
      captureCase.request.envelope.capturedAt > latest
        ? captureCase.request.envelope.capturedAt
        : latest,
    corpus.captures[0].request.envelope.capturedAt
  );

  const fail = (caseId, dimension, reason) => {
    failures.push(Object.freeze({ caseId, dimension, reason }));
    failedCaseIds.add(caseId);
  };

  let sourceBodyLeakage = 0;
  let unauthorizedCandidateCreation = 0;
  let unauthorizedTrustedMemoryCreation = 0;
  let freshnessViolations = 0;
  let replayViolations = 0;
  let ownerLeakage = 0;
  let namespaceLeakage = 0;
  let adversarialEscapes = 0;
  let unhandledCases = 0;
  let exactSetPasses = 0;
  let precisionTotal = 0;
  let recallTotal = 0;
  let provenancePasses = 0;
  let provenanceCases = 0;

  const observedCaptures = Array.isArray(observations?.captures) ? observations.captures : [];
  const observedSearches = Array.isArray(observations?.searches) ? observations.searches : [];
  const observedReplays = Array.isArray(observations?.replays) ? observations.replays : [];
  const observedBoundaries = Array.isArray(observations?.boundaries)
    ? observations.boundaries
    : [];
  for (const [group, expectedCases, observedCases] of [
    ["captures", corpus.captures, observedCaptures],
    ["searches", corpus.searchCases, observedSearches],
    ["replays", corpus.replayCases, observedReplays],
    ["boundaries", corpus.boundaryCases, observedBoundaries]
  ]) {
    for (const [index, expectedCase] of expectedCases.entries()) {
      if (observedCases[index]?.caseId !== expectedCase.caseId) {
        unhandledCases += 1;
        fail(
          expectedCase.caseId,
          "unhandled_cases",
          `${group} observation was missing or out of order`
        );
      }
    }
    for (const extraObservation of observedCases.slice(expectedCases.length)) {
      unhandledCases += 1;
      fail(
        extraObservation?.caseId ?? `${group}_unexpected_observation`,
        "unhandled_cases",
        `${group} contained an unexpected observation`
      );
    }
  }

  const allObservedCases = [
    ...observedCaptures,
    ...observedSearches,
    ...observedReplays,
    ...observedBoundaries
  ];
  const safeResultsByCaseId = new Map();
  const unsafeResultCaseIds = new Set();

  for (const observation of allObservedCases) {
    if (!observation.handled) {
      unhandledCases += 1;
      fail(observation.caseId, "unhandled_cases", "case recipe was not evaluated");
      continue;
    }
    const resultSnapshot = snapshotDescriptorSafeValue(observation.result);
    if (!resultSnapshot.ok) {
      unsafeResultCaseIds.add(observation.caseId);
      sourceBodyLeakage += 1;
      fail(
        observation.caseId,
        "source_body_leakage",
        "result could not be inspected without executing untrusted behavior"
      );
      continue;
    }
    const result = resultSnapshot.value;
    if (resultContainsSourceBody(result, sourceBodies) || containsForbiddenBodyKey(result)) {
      sourceBodyLeakage += 1;
      fail(observation.caseId, "source_body_leakage", "result retained or returned a source body");
    }
    const expectedResultKeys = resultKeysForCase(observation.caseId);
    if (
      expectedResultKeys === undefined ||
      !exactKeys(result, expectedResultKeys) ||
      !hasExactKnownResultShapes(result)
    ) {
      unhandledCases += 1;
      fail(
        observation.caseId,
        "unhandled_cases",
        "result projection contained missing, extra, hidden, symbol, or non-canonical fields"
      );
      continue;
    }
    safeResultsByCaseId.set(observation.caseId, result);
    if (result?.pendingCandidateCreated === true) {
      unauthorizedCandidateCreation += 1;
      fail(
        observation.caseId,
        "memory_lifecycle",
        "capture or retrieval created a pending candidate"
      );
    }
    if (result?.trustedMemoryCreated === true) {
      unauthorizedTrustedMemoryCreation += 1;
      fail(
        observation.caseId,
        "memory_lifecycle",
        "capture or retrieval created trusted memory"
      );
    }
  }

  const resultProjectionOracleDigest = createHash("sha256")
    .update(
      JSON.stringify(
        allObservedCases.map((observation) => [
          observation.caseId,
          safeResultsByCaseId.has(observation.caseId)
            ? safeResultsByCaseId.get(observation.caseId)
            : null
        ])
      ),
      "utf8"
    )
    .digest("hex");
  if (resultProjectionOracleDigest !== requiredResultProjectionOracleDigest) {
    unhandledCases += 1;
    fail(
      "result_projection_oracle",
      "unhandled_cases",
      "observed result values or array cardinalities differed from the pinned oracle"
    );
  }

  for (const [index, captureCase] of corpus.captures.entries()) {
    const observation = observedCaptures[index];
    const result = safeResultsByCaseId.get(observation?.caseId);
    provenanceCases += 1;
    const expected = expectedStateEntry(corpus.captureCaller.ownerId, captureCase.request);
    const actualEntry = result?.state?.entries?.find(
      (entry) =>
        entry.captureRequestId === captureCase.request.requestId &&
        entry.sourceRecordId === captureCase.request.envelope.sourceRecordId &&
        entry.sourceRevision === captureCase.request.envelope.sourceRevision
    );
    const captureProvenanceValid =
      result?.status === "allowed" &&
      result?.captureDisposition === "appended" &&
      result?.contentDigest === expected.contentDigest &&
      result?.envelopeDigest === expected.envelopeDigest &&
      exactKeys(actualEntry, stateEntryKeys) &&
      sameJson(actualEntry, expected) &&
      result?.citationCount === 1 &&
      sameJson(result?.citations, [expected.citation]) &&
      result?.contextCaptured === true &&
      result?.pendingCandidateCreated === false &&
      result?.trustedMemoryCreated === false &&
      result?.noAutoPromotion === true;
    if (captureProvenanceValid) {
      provenancePasses += 1;
    } else {
      fail(captureCase.caseId, "citation_provenance", "capture provenance projection differed");
    }
    const expectedCaptureFreshness = corpus.captures
      .slice(0, index + 1)
      .reduce(
        (latest, candidate) =>
          candidate.request.envelope.capturedAt > latest
            ? candidate.request.envelope.capturedAt
            : latest,
        corpus.captures[0].request.envelope.capturedAt
      );
    if (result?.synchronizedThrough !== expectedCaptureFreshness) {
      freshnessViolations += 1;
      fail(captureCase.caseId, "freshness", "capture freshness was not scoped and monotonic");
    }
  }

  for (const [index, searchCase] of corpus.searchCases.entries()) {
    const observation = observedSearches[index];
    const result = safeResultsByCaseId.get(observation?.caseId);
    const actualEvidence = Array.isArray(result?.contextEvidence) ? result.contextEvidence : [];
    const actualIds = actualEvidence.map(evidenceId);
    const expectedIds = [...searchCase.expectedEvidence];
    const exactSet = sameStringSet(actualIds, expectedIds);
    if (result?.status === "allowed" && exactSet) {
      exactSetPasses += 1;
    } else {
      fail(searchCase.caseId, "retrieval_quality", "retrieved evidence set differed");
    }

    const actualAtK = actualIds.slice(0, searchCase.k);
    const uniqueHitsAtK = new Set(
      actualAtK.filter((id) => expectedIds.includes(id))
    ).size;
    const precisionAtK =
      expectedIds.length === 0
        ? actualIds.length === 0
          ? 1
          : 0
        : uniqueHitsAtK / searchCase.k;
    const recallAtK =
      expectedIds.length === 0
        ? actualIds.length === 0
          ? 1
          : 0
        : uniqueHitsAtK / expectedIds.length;
    precisionTotal += precisionAtK;
    recallTotal += recallAtK;

    provenanceCases += 1;
    const expectedEvidence = expectedIds.map((id) => expectedEvidenceById.get(id));
    const projectionValid =
      expectedEvidence.every((entry) => entry !== undefined) &&
      actualEvidence.every((entry) => exactKeys(entry, searchEvidenceKeys)) &&
      sameEvidenceSet(actualEvidence, expectedEvidence) &&
      sameJson(
        result?.citations,
        actualEvidence.map((entry) => entry.citation)
      ) &&
      result?.citationCount === actualEvidence.length &&
      result?.sourceEvidenceReturned === (actualEvidence.length > 0) &&
      result?.trustedMemoryReturned === false &&
      result?.pendingCandidateCreated === false &&
      result?.trustedMemoryCreated === false &&
      result?.noAutoPromotion === true;
    if (projectionValid) {
      provenancePasses += 1;
    } else {
      fail(searchCase.caseId, "citation_provenance", "search projection or citation differed");
    }
    if (result?.synchronizedThrough !== expectedScopedFreshness) {
      freshnessViolations += 1;
      fail(searchCase.caseId, "freshness", "search freshness regressed from scoped state");
    }
  }

  for (const [index, replayCase] of corpus.replayCases.entries()) {
    const observation = observedReplays[index];
    const result = safeResultsByCaseId.get(observation?.caseId);
    const statusMatches = result?.status === replayCase.expectedStatus;
    const dispositionMatches =
      replayCase.expectedDisposition === undefined ||
      result?.captureDisposition === replayCase.expectedDisposition;
    const denialMatches =
      replayCase.expectedDenialReason === undefined ||
      result?.denialReason === replayCase.expectedDenialReason;
    if (!statusMatches || !dispositionMatches || !denialMatches || observation?.sameState !== true) {
      replayViolations += 1;
      fail(replayCase.caseId, "replay", "replay or conflict behavior differed");
    }
  }

  for (const [index, boundaryCase] of corpus.boundaryCases.entries()) {
    const observation = observedBoundaries[index];
    if (!observation?.handled) continue;
    if (unsafeResultCaseIds.has(observation.caseId)) {
      adversarialEscapes += 1;
      fail(boundaryCase.caseId, "adversarial", "boundary result was unsafe to inspect");
      if (["wrong_owner", "foreign_trusted_state"].includes(boundaryCase.recipe)) {
        ownerLeakage += 1;
        fail(boundaryCase.caseId, "owner_isolation", "foreign owner result was unsafe to inspect");
      }
      if (["wrong_namespace", "mixed_scope_state"].includes(boundaryCase.recipe)) {
        namespaceLeakage += 1;
        fail(
          boundaryCase.caseId,
          "namespace_isolation",
          "foreign namespace result was unsafe to inspect"
        );
      }
      continue;
    }
    const result = safeResultsByCaseId.get(observation.caseId);
    const escaped =
      observation.threw === true ||
      observation.getterReads > 0 ||
      result?.status !== "denied" ||
      (Array.isArray(result?.contextEvidence) && result.contextEvidence.length > 0) ||
      (Array.isArray(result?.citations) && result.citations.length > 0);
    if (escaped) {
      adversarialEscapes += 1;
      fail(boundaryCase.caseId, "adversarial", "authorization or malformed boundary did not fail closed");
    }

    if (["wrong_owner", "foreign_trusted_state"].includes(boundaryCase.recipe)) {
      const leaked = boundaryLeaks(result, observation.forbiddenFragments);
      if (leaked) {
        ownerLeakage += 1;
        fail(boundaryCase.caseId, "owner_isolation", "foreign owner metadata was released");
      }
    }
    if (["wrong_namespace", "mixed_scope_state"].includes(boundaryCase.recipe)) {
      const leaked = boundaryLeaks(result, observation.forbiddenFragments);
      if (leaked) {
        namespaceLeakage += 1;
        fail(boundaryCase.caseId, "namespace_isolation", "foreign namespace metadata was released");
      }
    }
  }

  const searchCount = corpus.searchCases.length;
  const metrics = Object.freeze({
    retrievalExpectedSetAccuracy: exactSetPasses / searchCount,
    precisionAtK: precisionTotal / searchCount,
    recallAtK: recallTotal / searchCount,
    citationProvenanceFidelity: provenancePasses / provenanceCases,
    ownerLeakage,
    namespaceLeakage,
    sourceBodyLeakage,
    unauthorizedCandidateCreation,
    unauthorizedTrustedMemoryCreation,
    replayViolations,
    freshnessViolations,
    adversarialEscapes,
    unhandledCases
  });

  for (const key of reportMetricKeys) {
    if (metrics[key] !== requiredThresholds[key]) {
      fail("eval_thresholds", "threshold", `${key} did not meet its hard threshold`);
    }
  }

  const total =
    corpus.captures.length +
    corpus.searchCases.length +
    corpus.replayCases.length +
    corpus.boundaryCases.length;
  const failed = [...failedCaseIds].filter((caseId) => caseId !== "eval_thresholds").length;
  const report = Object.freeze({
    evalType: corpus.evalType,
    corpusVersion: corpus.corpusVersion,
    fixtureSafety: corpus.fixtureSafety,
    execution: Object.freeze({
      networkAccess: corpus.networkAccess,
      modelJudge: corpus.modelJudge,
      orderingContract: corpus.orderingContract
    }),
    evaluatedDimensions,
    verdict: failures.length === 0 ? "PASS" : "FAIL",
    caseTotals: Object.freeze({
      total,
      passed: total - failed,
      failed,
      unhandled: unhandledCases
    }),
    metrics,
    thresholds: requiredThresholds,
    failures: Object.freeze(failures)
  });
  return report;
}

export function runContextQualityMutationSelfTest(corpus) {
  const baseline = collectContextQualityObservations(corpus);
  const probes = [
    {
      probeId: "incorrect_retrieval",
      mutate(observations) {
        observations.searches[0].result.contextEvidence = [];
      },
      detected(report) {
        return report.metrics.retrievalExpectedSetAccuracy < 1;
      }
    },
    {
      probeId: "citation_mismatch",
      mutate(observations) {
        observations.searches[0].result.contextEvidence[0].citation.address =
          "synthetic://context-eval/mutated-citation";
      },
      detected(report) {
        return report.metrics.citationProvenanceFidelity < 1;
      }
    },
    {
      probeId: "source_body_leakage",
      mutate(observations) {
        observations.searches[0].result.contextEvidence[0].content =
          corpus.captures[0].request.envelope.content;
      },
      detected(report) {
        return report.metrics.sourceBodyLeakage > 0;
      }
    },
    {
      probeId: "unauthorized_promotion",
      mutate(observations) {
        observations.searches[0].result.pendingCandidateCreated = true;
        observations.searches[0].result.trustedMemoryCreated = true;
      },
      detected(report) {
        return (
          report.metrics.unauthorizedCandidateCreation > 0 &&
          report.metrics.unauthorizedTrustedMemoryCreation > 0
        );
      }
    },
    {
      probeId: "replay_conflict_acceptance",
      mutate(observations) {
        const conflict = observations.replays.find(
          (observation) => observation.caseId === "replay_request_conflict"
        );
        conflict.result.status = "allowed";
        delete conflict.result.denialReason;
      },
      detected(report) {
        return report.metrics.replayViolations > 0;
      }
    },
    {
      probeId: "authorization_boundary_acceptance",
      mutate(observations) {
        const wrongOwner = observations.boundaries.find(
          (observation) => observation.caseId === "boundary_wrong_owner"
        );
        wrongOwner.result.status = "allowed";
      },
      detected(report) {
        return report.metrics.adversarialEscapes > 0;
      }
    },
    {
      probeId: "owner_scope_leak",
      mutate(observations) {
        const wrongOwner = observations.boundaries.find(
          (observation) => observation.caseId === "boundary_wrong_owner"
        );
        const leakedEvidence = observations.searches[0].result.contextEvidence;
        wrongOwner.result.status = "allowed";
        wrongOwner.result.contextEvidence = leakedEvidence;
        wrongOwner.result.citations = leakedEvidence.map((entry) => entry.citation);
      },
      detected(report) {
        return report.metrics.ownerLeakage > 0;
      }
    },
    {
      probeId: "malformed_boundary_acceptance",
      mutate(observations) {
        const malformed = observations.boundaries.find(
          (observation) => observation.caseId === "boundary_unknown_key"
        );
        malformed.result.status = "allowed";
      },
      detected(report) {
        return report.metrics.adversarialEscapes > 0;
      }
    },
    {
      probeId: "weakened_thresholds",
      execute() {
        const weakened = structuredClone(corpus);
        weakened.thresholds.ownerLeakage = 1;
        try {
          collectContextQualityObservations(weakened);
          return false;
        } catch (error) {
          return (
            error instanceof Error &&
            error.message === "context quality eval thresholds invalid"
          );
        }
      }
    }
  ];

  const results = probes.map((probe) => {
    if (probe.execute !== undefined) {
      return Object.freeze({
        probeId: probe.probeId,
        detected: probe.execute()
      });
    }
    const observations = structuredClone(baseline);
    probe.mutate(observations);
    const report = evaluateContextQualityObservations(corpus, observations);
    return Object.freeze({
      probeId: probe.probeId,
      detected: report.verdict === "FAIL" && probe.detected(report)
    });
  });
  const detected = results.filter((result) => result.detected).length;
  return Object.freeze({
    verdict: detected === results.length ? "PASS" : "FAIL",
    detected,
    total: results.length,
    probes: Object.freeze(results)
  });
}

export function stableContextQualityReportJson(report) {
  return `${JSON.stringify(report)}\n`;
}

export function renderContextQualityScorecard(report) {
  const metrics = report.metrics;
  return [
    "Source-Wire Context Quality Eval v0",
    `Corpus: ${report.corpusVersion}`,
    `Dimensions: ${report.evaluatedDimensions.join(", ")}`,
    `Cases: ${report.caseTotals.passed}/${report.caseTotals.total} passed`,
    `Retrieval expected-set accuracy: ${formatRatio(metrics.retrievalExpectedSetAccuracy)}`,
    `Precision@K: ${formatRatio(metrics.precisionAtK)}`,
    `Recall@K: ${formatRatio(metrics.recallAtK)}`,
    `Citation/provenance fidelity: ${formatRatio(metrics.citationProvenanceFidelity)}`,
    `Owner leakage: ${metrics.ownerLeakage}`,
    `Namespace leakage: ${metrics.namespaceLeakage}`,
    `Source-body leakage: ${metrics.sourceBodyLeakage}`,
    `Unauthorized candidates: ${metrics.unauthorizedCandidateCreation}`,
    `Unauthorized trusted memory: ${metrics.unauthorizedTrustedMemoryCreation}`,
    `Replay violations: ${metrics.replayViolations}`,
    `Freshness violations: ${metrics.freshnessViolations}`,
    `Adversarial escapes: ${metrics.adversarialEscapes}`,
    `Unhandled cases: ${metrics.unhandledCases}`,
    `Verdict: ${report.verdict}`
  ].join("\n");
}

function collectReplayObservation(corpus, state, replayCase) {
  const firstRequest = corpus.captures[0].request;
  const secondRequest = corpus.captures[1].request;
  let request;
  switch (replayCase.recipe) {
    case "exact_replay":
      request = firstRequest;
      break;
    case "legitimate_reobservation":
      request = {
        ...firstRequest,
        requestId: "req_eval_delivery_reobservation_001",
        envelope: {
          ...firstRequest.envelope,
          envelopeId: "env_eval_delivery_reobservation_001",
          capturedAt: "2026-08-10T12:00:00.000Z"
        }
      };
      break;
    case "request_conflict":
      request = {
        ...firstRequest,
        envelope: {
          ...firstRequest.envelope,
          envelopeId: "env_eval_request_conflict_001",
          sourceRecordId: "source_eval_request_conflict",
          sourceRevision: "1",
          sourceLocator: "synthetic://context-eval/request-conflict",
          content: replayRequestConflictSourceBody
        }
      };
      break;
    case "envelope_conflict":
      request = {
        ...firstRequest,
        requestId: "req_eval_envelope_conflict_001",
        envelope: {
          ...firstRequest.envelope,
          sourceRecordId: "source_eval_envelope_conflict",
          sourceRevision: "1",
          sourceLocator: "synthetic://context-eval/envelope-conflict",
          content: replayEnvelopeConflictSourceBody
        }
      };
      break;
    case "source_revision_conflict":
      request = {
        ...firstRequest,
        requestId: "req_eval_revision_conflict_001",
        envelope: {
          ...firstRequest.envelope,
          envelopeId: "env_eval_revision_conflict_001",
          content: replayRevisionConflictSourceBody
        }
      };
      break;
    case "cross_bound_conflict":
      request = {
        ...firstRequest,
        envelope: {
          ...firstRequest.envelope,
          envelopeId: secondRequest.envelope.envelopeId
        }
      };
      break;
    default:
      return Object.freeze({
        caseId: replayCase.caseId,
        handled: false,
        result: undefined,
        sameState: false
      });
  }
  const result = transitionRuntimeSkeletonContextCapture(state, corpus.captureCaller, request);
  return Object.freeze({
    caseId: replayCase.caseId,
    handled: true,
    result,
    sameState: result.state === state
  });
}

function createForeignTrustedState(corpus) {
  const caller = {
    callerId: "caller_eval_capture_beta",
    ownerId: "owner_eval_beta",
    kind: "mcp_tool",
    allowedNamespaceIds: ["ns_eval_beta"],
    capabilities: ["import_or_maintain_sources"]
  };
  const request = {
    requestId: "req_eval_beta_001",
    tool: "capture_context",
    namespaceId: "ns_eval_beta",
    envelope: {
      ...corpus.captures[0].request.envelope,
      envelopeId: "env_eval_beta_001",
      sourceRecordId: "source_eval_beta",
      sourceRevision: "1",
      title: "Synthetic beta context",
      sourceLocator: "synthetic://context-eval/beta",
      content: foreignOwnerSourceBody
    }
  };
  const result = transitionRuntimeSkeletonContextCapture(
    createRuntimeSkeletonContextInboxState(),
    caller,
    request
  );
  return Object.freeze({ caller, request, result });
}

function collectBoundaryObservation(corpus, state, beta, boundaryCase) {
  let getterReads = 0;
  let forbiddenFragments = [];
  const baseSearchRequest = {
    requestId: `req_${boundaryCase.caseId}`,
    tool: "search_source_evidence",
    namespaceId: corpus.searchCaller.allowedNamespaceIds[0],
    query: "synthetic"
  };
  let invoke;

  switch (boundaryCase.recipe) {
    case "wrong_owner":
      invoke = () =>
        searchRuntimeSkeletonContextInbox(
          state,
          {
            ...corpus.searchCaller,
            callerId: "caller_eval_wrong_owner",
            ownerId: "owner_eval_beta"
          },
          baseSearchRequest
        );
      forbiddenFragments = corpus.captures.map(
        (captureCase) => captureCase.request.envelope.sourceLocator
      );
      break;
    case "wrong_namespace":
      invoke = () =>
        searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, {
          ...baseSearchRequest,
          namespaceId: "ns_eval_beta"
        });
      forbiddenFragments = corpus.captures.map(
        (captureCase) => captureCase.request.envelope.sourceLocator
      );
      break;
    case "missing_capability":
      invoke = () =>
        searchRuntimeSkeletonContextInbox(
          state,
          { ...corpus.searchCaller, callerId: "caller_eval_no_capability", capabilities: [] },
          baseSearchRequest
        );
      break;
    case "foreign_trusted_state":
      invoke = () =>
        transitionRuntimeSkeletonContextCapture(beta.result.state, corpus.captureCaller, {
          ...corpus.captures[0].request,
          requestId: "req_eval_foreign_trusted_state_001",
          namespaceId: "ns_eval_beta"
        });
      forbiddenFragments = [beta.request.envelope.sourceLocator, beta.request.envelope.content];
      break;
    case "mixed_scope_state": {
      const mixedState = {
        contractVersion: "source-wire.context-inbox-state.v1",
        entries: [...state.entries, ...beta.result.state.entries],
        synchronizedThrough:
          state.synchronizedThrough > beta.result.state.synchronizedThrough
            ? state.synchronizedThrough
            : beta.result.state.synchronizedThrough
      };
      invoke = () =>
        searchRuntimeSkeletonContextInbox(mixedState, corpus.searchCaller, baseSearchRequest);
      forbiddenFragments = [beta.request.envelope.sourceLocator];
      break;
    }
    case "unknown_key":
      invoke = () =>
        searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, {
          ...baseSearchRequest,
          unexpected: true
        });
      break;
    case "hidden_key": {
      const request = { ...baseSearchRequest };
      Object.defineProperty(request, "hidden", { value: true, enumerable: false });
      invoke = () => searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, request);
      break;
    }
    case "inherited_key": {
      const request = Object.assign(Object.create({ inherited: true }), baseSearchRequest);
      invoke = () => searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, request);
      break;
    }
    case "symbol_key": {
      const request = { ...baseSearchRequest, [Symbol("hidden")]: true };
      invoke = () => searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, request);
      break;
    }
    case "accessor": {
      const caller = { ...corpus.searchCaller };
      Object.defineProperty(caller, "ownerId", {
        enumerable: true,
        get() {
          getterReads += 1;
          return corpus.searchCaller.ownerId;
        }
      });
      invoke = () => searchRuntimeSkeletonContextInbox(state, caller, baseSearchRequest);
      break;
    }
    case "own_proto": {
      const request = { ...baseSearchRequest };
      const poison = {};
      Object.defineProperty(poison, "secret", {
        get() {
          getterReads += 1;
          return "synthetic";
        }
      });
      Object.defineProperty(request, "__proto__", {
        enumerable: true,
        value: poison
      });
      invoke = () => searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, request);
      break;
    }
    case "custom_prototype": {
      const caller = Object.assign(Object.create({}), corpus.searchCaller);
      invoke = () => searchRuntimeSkeletonContextInbox(state, caller, baseSearchRequest);
      break;
    }
    case "sparse_array": {
      const capabilities = new Array(2);
      capabilities[0] = "read_source_evidence";
      const caller = { ...corpus.searchCaller, capabilities };
      invoke = () => searchRuntimeSkeletonContextInbox(state, caller, baseSearchRequest);
      break;
    }
    case "custom_array": {
      const capabilities = [...corpus.searchCaller.capabilities];
      capabilities.syntheticExtra = true;
      const caller = { ...corpus.searchCaller, capabilities };
      invoke = () => searchRuntimeSkeletonContextInbox(state, caller, baseSearchRequest);
      break;
    }
    case "transparent_proxy":
      invoke = () =>
        searchRuntimeSkeletonContextInbox(
          state,
          new Proxy(corpus.searchCaller, {}),
          baseSearchRequest
        );
      break;
    case "revoked_proxy": {
      const revoked = Proxy.revocable(baseSearchRequest, {});
      revoked.revoke();
      invoke = () => searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, revoked.proxy);
      break;
    }
    case "malformed_id":
      invoke = () =>
        searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, {
          ...baseSearchRequest,
          requestId: " "
        });
      break;
    case "malformed_query":
      invoke = () =>
        searchRuntimeSkeletonContextInbox(state, corpus.searchCaller, {
          ...baseSearchRequest,
          query: "   "
        });
      break;
    case "malformed_state":
      invoke = () =>
        searchRuntimeSkeletonContextInbox(
          {
            contractVersion: "source-wire.context-inbox-state.v1",
            entries: [{ ...state.entries[0], content: corpus.captures[0].request.envelope.content }],
            synchronizedThrough: state.synchronizedThrough
          },
          corpus.searchCaller,
          baseSearchRequest
        );
      break;
    default:
      return Object.freeze({
        caseId: boundaryCase.caseId,
        handled: false,
        result: undefined,
        threw: false,
        getterReads,
        forbiddenFragments
      });
  }

  let result;
  let threw = false;
  try {
    result = invoke();
  } catch {
    threw = true;
    result = Object.freeze({ status: "threw" });
  }
  return Object.freeze({
    caseId: boundaryCase.caseId,
    handled: true,
    result,
    threw,
    getterReads,
    forbiddenFragments: Object.freeze(forbiddenFragments)
  });
}

function expectedStateEntry(ownerId, request) {
  return Object.freeze({
    ownerId,
    namespaceId: request.namespaceId,
    captureRequestId: request.requestId,
    ...expectedSearchEvidence(request)
  });
}

function expectedSearchEvidence(request) {
  const envelope = request.envelope;
  const contentDigest = createHash("sha256").update(envelope.content, "utf8").digest("hex");
  const canonicalEnvelope = JSON.stringify({
    envelopeId: envelope.envelopeId,
    sourceKind: envelope.sourceKind,
    sourceRecordId: envelope.sourceRecordId,
    sourceRevision: envelope.sourceRevision,
    title: envelope.title,
    sourceLocator: envelope.sourceLocator,
    sourceOccurredAt: envelope.sourceOccurredAt,
    capturedAt: envelope.capturedAt,
    sensitivity: envelope.sensitivity,
    contentDigest,
    fixtureSafety: "synthetic",
    instructionAuthority: "none"
  });
  const envelopeDigest = createHash("sha256").update(canonicalEnvelope, "utf8").digest("hex");
  return Object.freeze({
    envelopeId: envelope.envelopeId,
    sourceKind: envelope.sourceKind,
    sourceRecordId: envelope.sourceRecordId,
    sourceRevision: envelope.sourceRevision,
    title: envelope.title,
    sourceLocator: envelope.sourceLocator,
    sourceOccurredAt: envelope.sourceOccurredAt,
    capturedAt: envelope.capturedAt,
    sensitivity: envelope.sensitivity,
    contentDigest,
    envelopeDigest,
    citation: Object.freeze({
      evidenceKind: "source_evidence",
      sourceId: envelope.sourceRecordId,
      segmentId: envelope.envelopeId,
      address: envelope.sourceLocator
    })
  });
}

function validateCorpus(corpus) {
  if (
    corpus?.evalType !== "source-wire.context-quality-eval.v0" ||
    corpus?.corpusVersion !== "1.0.0" ||
    corpus?.fixtureSafety !== "synthetic" ||
    corpus?.networkAccess !== "none" ||
    corpus?.modelJudge !== false ||
    corpus?.orderingContract !== "set_only" ||
    !Array.isArray(corpus.captures) ||
    corpus.captures.length === 0 ||
    !Array.isArray(corpus.searchCases) ||
    corpus.searchCases.length === 0 ||
    !Array.isArray(corpus.replayCases) ||
    !Array.isArray(corpus.boundaryCases)
  ) {
    throw new Error("context quality eval corpus invalid");
  }
  if (
    !exactKeys(corpus.thresholds, reportMetricKeys) ||
    !sameJson(corpus.thresholds, requiredThresholds)
  ) {
    throw new Error("context quality eval thresholds invalid");
  }
  for (const [group, expectedCases] of Object.entries(requiredCaseMatrix)) {
    const actualCases = corpus[group].map((entry) =>
      entry.recipe === undefined ? entry.caseId : `${entry.caseId}:${entry.recipe}`
    );
    if (!sameJson(actualCases, expectedCases)) {
      throw new Error("context quality eval case matrix invalid");
    }
  }
  const corpusOracleDigest = createHash("sha256")
    .update(JSON.stringify(corpus), "utf8")
    .digest("hex");
  if (corpusOracleDigest !== requiredCorpusOracleDigest) {
    throw new Error("context quality eval corpus oracle invalid");
  }
  const caseIds = [
    ...corpus.captures,
    ...corpus.searchCases,
    ...corpus.replayCases,
    ...corpus.boundaryCases
  ].map((entry) => entry.caseId);
  if (new Set(caseIds).size !== caseIds.length) {
    throw new Error("context quality eval case identifiers must be unique");
  }
}

function resultKeysForCase(caseId) {
  if (requiredCaseMatrix.captures.includes(caseId)) return captureResultKeys;
  if (requiredCaseMatrix.searchCases.includes(caseId)) return searchResultKeys;
  if (["replay_exact_request", "replay_legitimate_reobservation"].includes(caseId)) {
    return captureResultKeys;
  }
  if (caseId.startsWith("replay_")) return replayDeniedResultKeys;
  if (caseId === "boundary_foreign_trusted_state") return foreignStateBoundaryResultKeys;
  if (boundaryCasesWithoutCapability.has(caseId)) return boundaryResultKeysWithoutCapability;
  if (caseId.startsWith("boundary_")) return boundaryResultKeys;
  return undefined;
}

function exactKeys(value, expectedKeys) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  let keys;
  try {
    keys = Reflect.ownKeys(value);
  } catch {
    return false;
  }
  if (keys.some((key) => typeof key !== "string")) return false;
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
      return false;
    }
  }
  return sameJson([...keys].sort(), [...expectedKeys].sort());
}

function exactArrayShape(value) {
  if (!Array.isArray(value)) return false;
  const actualKeys = Reflect.ownKeys(value);
  if (actualKeys.some((key) => typeof key !== "string")) return false;
  const expectedKeys = Array.from({ length: value.length }, (_, index) => String(index));
  expectedKeys.push("length");
  if (!sameStringSet(actualKeys, expectedKeys)) return false;
  for (const key of actualKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) return false;
    if (key === "length") {
      if (descriptor.enumerable || descriptor.value !== value.length) return false;
    } else if (!descriptor.enumerable) {
      return false;
    }
  }
  return true;
}

function hasExactKnownResultShapes(result) {
  if (!exactKeys(result.audit, auditKeys)) return false;
  if (!exactArrayShape(result.gapKinds) || !result.gapKinds.every((entry) => typeof entry === "string")) {
    return false;
  }
  if (
    !exactArrayShape(result.citations) ||
    !result.citations.every((citation) => exactKeys(citation, citationKeys))
  ) {
    return false;
  }
  if (Object.hasOwn(result, "contextEvidence")) {
    if (
      !exactArrayShape(result.contextEvidence) ||
      !result.contextEvidence.every(
        (entry) => exactKeys(entry, searchEvidenceKeys) && exactKeys(entry.citation, citationKeys)
      )
    ) {
      return false;
    }
  }
  if (Object.hasOwn(result, "state")) {
    if (
      result.state === null ||
      typeof result.state !== "object" ||
      Array.isArray(result.state)
    ) {
      return false;
    }
    const stateKeys = Object.hasOwn(result.state, "synchronizedThrough")
      ? ["contractVersion", "entries", "synchronizedThrough"]
      : ["contractVersion", "entries"];
    if (!exactKeys(result.state, stateKeys) || !exactArrayShape(result.state.entries)) return false;
    if (
      !result.state.entries.every(
        (entry) => exactKeys(entry, stateEntryKeys) && exactKeys(entry.citation, citationKeys)
      )
    ) {
      return false;
    }
  }
  return true;
}

function evidenceId(evidence) {
  return `${evidence.sourceRecordId}@${evidence.sourceRevision}`;
}

function sameEvidenceSet(actual, expected) {
  if (actual.length !== expected.length) return false;
  const actualById = new Map(actual.map((entry) => [evidenceId(entry), entry]));
  return expected.every(
    (entry) => entry !== undefined && sameJson(actualById.get(evidenceId(entry)), entry)
  );
}

function sameStringSet(actual, expected) {
  return sameJson([...actual].sort(), [...expected].sort());
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

const sourceBodyLeakFragmentLength = 24;

function snapshotDescriptorSafeValue(value, active = new Set()) {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return { ok: true, value };
  }
  if (typeof value !== "object" || active.has(value)) return { ok: false };
  if (nodeUtilTypes.isProxy(value)) return { ok: false };

  let arrayValue;
  let prototype;
  let keys;
  try {
    arrayValue = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    return { ok: false };
  }
  if (
    (arrayValue && prototype !== Array.prototype) ||
    (!arrayValue && prototype !== Object.prototype && prototype !== null)
  ) {
    return { ok: false };
  }

  const snapshot = arrayValue ? [] : Object.create(null);
  let arrayLength = 0;
  active.add(value);
  for (const key of keys) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      active.delete(value);
      return { ok: false };
    }
    if (descriptor === undefined || "get" in descriptor || "set" in descriptor) {
      active.delete(value);
      return { ok: false };
    }
    if (arrayValue && key === "length") {
      arrayLength = descriptor.value;
      continue;
    }
    const nested = snapshotDescriptorSafeValue(descriptor.value, active);
    if (!nested.ok) {
      active.delete(value);
      return { ok: false };
    }
    try {
      Object.defineProperty(snapshot, key, {
        value: nested.value,
        enumerable: descriptor.enumerable,
        configurable: true,
        writable: true
      });
    } catch {
      active.delete(value);
      return { ok: false };
    }
  }
  active.delete(value);
  if (arrayValue) {
    if (!Number.isSafeInteger(arrayLength) || arrayLength < 0) return { ok: false };
    snapshot.length = arrayLength;
  }
  return { ok: true, value: snapshot };
}

function stringContainsSourceBody(value, sourceBodies) {
  return sourceBodies.some((body) => {
    if (body.length <= sourceBodyLeakFragmentLength) return value.includes(body);
    for (let index = 0; index <= body.length - sourceBodyLeakFragmentLength; index += 1) {
      if (value.includes(body.slice(index, index + sourceBodyLeakFragmentLength))) {
        return true;
      }
    }
    return false;
  });
}

function descriptorSafeSomeString(value, predicate, seen = new Set()) {
  if (typeof value === "string") return predicate(value);
  if ((typeof value !== "object" && typeof value !== "function") || value === null) {
    return false;
  }
  if (seen.has(value)) return false;
  seen.add(value);
  let keys;
  try {
    keys = Reflect.ownKeys(value);
  } catch {
    return true;
  }
  for (const key of keys) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      return true;
    }
    if (descriptor === undefined || "get" in descriptor || "set" in descriptor) {
      return true;
    }
    if (descriptorSafeSomeString(descriptor.value, predicate, seen)) return true;
  }
  return false;
}

function resultContainsSourceBody(result, sourceBodies) {
  return descriptorSafeSomeString(result, (value) =>
    stringContainsSourceBody(value, sourceBodies)
  );
}

function containsForbiddenBodyKey(value, seen = new Set()) {
  if ((typeof value !== "object" && typeof value !== "function") || value === null) {
    return false;
  }
  if (seen.has(value)) return false;
  seen.add(value);
  let keys;
  try {
    keys = Reflect.ownKeys(value);
  } catch {
    return true;
  }
  for (const key of keys) {
    const keyText = typeof key === "symbol" ? key.description : key;
    if (keyText === "content" || keyText === "sourceBody" || keyText === "body") {
      return true;
    }
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      return true;
    }
    if (descriptor === undefined || "get" in descriptor || "set" in descriptor) {
      return true;
    }
    if (containsForbiddenBodyKey(descriptor.value, seen)) return true;
  }
  return false;
}

function boundaryLeaks(result, forbiddenFragments = []) {
  if (result === undefined) return false;
  if (result === null || typeof result !== "object") return true;
  if (Array.isArray(result.contextEvidence) && result.contextEvidence.length > 0) return true;
  if (Array.isArray(result.citations) && result.citations.length > 0) return true;
  if (result.synchronizedThrough !== undefined) return true;
  return descriptorSafeSomeString(result, (value) =>
    forbiddenFragments.some((fragment) => value.includes(fragment))
  );
}

function formatRatio(value) {
  return value.toFixed(2);
}

async function runCli() {
  const corpus = JSON.parse(await readFile(corpusUrl, "utf8"));
  if (process.argv.includes("--self-test")) {
    const selfTest = runContextQualityMutationSelfTest(corpus);
    process.stdout.write("Source-Wire Context Quality Eval v0 mutation self-test\n");
    for (const probe of selfTest.probes) {
      process.stdout.write(`${probe.detected ? "ok" : "not ok"} ${probe.probeId}\n`);
    }
    process.stdout.write(`Detected: ${selfTest.detected}/${selfTest.total}\n`);
    process.stdout.write(`Verdict: ${selfTest.verdict}\n`);
    if (selfTest.verdict !== "PASS") process.exitCode = 1;
    return;
  }
  const observations = collectContextQualityObservations(corpus);
  const report = evaluateContextQualityObservations(corpus, observations);
  if (process.argv.includes("--json")) {
    process.stdout.write(stableContextQualityReportJson(report));
  } else {
    process.stdout.write(`${renderContextQualityScorecard(report)}\n`);
    process.stdout.write("CONTEXT_QUALITY_EVAL_REPORT_JSON\n");
    process.stdout.write(stableContextQualityReportJson(report));
  }
  if (report.verdict !== "PASS") process.exitCode = 1;
}

const invokedPath = process.argv[1] === undefined ? undefined : resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  await runCli();
}
