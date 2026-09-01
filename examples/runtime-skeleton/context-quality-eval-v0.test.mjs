import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  collectContextQualityObservations,
  evaluateContextQualityObservations,
  runContextQualityMutationSelfTest,
  stableContextQualityReportJson
} from "./context-quality-eval-v0.mjs";

const corpus = JSON.parse(
  await readFile(
    new URL("../fixtures/runtime-skeleton/context-quality-eval-v0.json", import.meta.url),
    "utf8"
  )
);

test("Context Quality Eval v0 passes the complete deterministic corpus", () => {
  const observations = collectContextQualityObservations(corpus);
  const report = evaluateContextQualityObservations(corpus, observations);

  assert.equal(report.verdict, "PASS");
  assert.equal(report.corpusVersion, "1.0.0");
  assert.equal(
    report.caseTotals.total,
    corpus.captures.length +
      corpus.searchCases.length +
      corpus.replayCases.length +
      corpus.boundaryCases.length
  );
  assert.equal(report.caseTotals.failed, 0);
  assert.equal(report.caseTotals.unhandled, 0);
  assert.deepEqual(report.metrics, corpus.thresholds);
  assert.deepEqual(Object.keys(report), [
    "evalType",
    "corpusVersion",
    "fixtureSafety",
    "execution",
    "evaluatedDimensions",
    "verdict",
    "caseTotals",
    "metrics",
    "thresholds",
    "failures"
  ]);
  assert.deepEqual(Object.keys(report.execution), [
    "networkAccess",
    "modelJudge",
    "orderingContract"
  ]);
  assert.deepEqual(Object.keys(report.caseTotals), ["total", "passed", "failed", "unhandled"]);
  assert.deepEqual(Object.keys(report.metrics), Object.keys(corpus.thresholds));
  assert.deepEqual(Object.keys(report.thresholds), Object.keys(corpus.thresholds));
  assert.deepEqual(report.evaluatedDimensions, [
    "retrieval_quality",
    "citation_and_provenance",
    "freshness_and_revision",
    "authorization_and_isolation",
    "retention_and_response_safety",
    "replay_and_conflict",
    "memory_lifecycle_separation",
    "adversarial_robustness"
  ]);
});

test("Context Quality Eval v0 report JSON is byte-stable", () => {
  const first = evaluateContextQualityObservations(
    corpus,
    collectContextQualityObservations(corpus)
  );
  const second = evaluateContextQualityObservations(
    corpus,
    collectContextQualityObservations(corpus)
  );

  assert.equal(stableContextQualityReportJson(first), stableContextQualityReportJson(second));
});

test("Context Quality Eval v0 detects every bounded sabotage family", () => {
  const selfTest = runContextQualityMutationSelfTest(corpus);

  assert.equal(selfTest.verdict, "PASS");
  assert.equal(selfTest.detected, 9);
  assert.equal(selfTest.total, 9);
  assert.deepEqual(
    selfTest.probes.map((probe) => [probe.probeId, probe.detected]),
    [
      ["incorrect_retrieval", true],
      ["citation_mismatch", true],
      ["source_body_leakage", true],
      ["unauthorized_promotion", true],
      ["replay_conflict_acceptance", true],
      ["authorization_boundary_acceptance", true],
      ["owner_scope_leak", true],
      ["malformed_boundary_acceptance", true],
      ["weakened_thresholds", true]
    ]
  );
});

test("Context Quality Eval v0 rejects weakened hard thresholds", () => {
  const weakened = structuredClone(corpus);
  weakened.thresholds.ownerLeakage = 1;

  assert.throws(
    () => collectContextQualityObservations(weakened),
    /context quality eval thresholds invalid/
  );
});

test("Context Quality Eval v0 detects generated replay source-body leakage", () => {
  const observations = structuredClone(collectContextQualityObservations(corpus));
  const replayConflict = observations.replays.find(
    (observation) => observation.caseId === "replay_request_conflict"
  );
  replayConflict.result.unexpectedDetail = "Synthetic request conflict body.";

  const report = evaluateContextQualityObservations(corpus, observations);

  assert.equal(report.verdict, "FAIL");
  assert.equal(report.metrics.sourceBodyLeakage, 1);
});

test("Context Quality Eval v0 detects a partial generated source-body excerpt", () => {
  const observations = structuredClone(collectContextQualityObservations(corpus));
  observations.replays[0].result.unexpectedDetail = "Synthetic request conflict";

  const report = evaluateContextQualityObservations(corpus, observations);

  assert.equal(report.verdict, "FAIL");
  assert.equal(report.metrics.sourceBodyLeakage, 1);
});

test("Context Quality Eval v0 detects hidden and symbol source-body fields without getters", () => {
  for (const fieldKind of ["non_enumerable", "symbol"]) {
    const observations = structuredClone(collectContextQualityObservations(corpus));
    const result = observations.replays[0].result;
    if (fieldKind === "non_enumerable") {
      Object.defineProperty(result, "unexpectedDetail", {
        value: "Synthetic request conflict body.",
        enumerable: false
      });
    } else {
      result[Symbol("unexpectedDetail")] = "Synthetic request conflict body.";
    }

    const report = evaluateContextQualityObservations(corpus, observations);

    assert.equal(report.verdict, "FAIL", fieldKind);
    assert.equal(report.metrics.sourceBodyLeakage, 1, fieldKind);
  }

  const observations = structuredClone(collectContextQualityObservations(corpus));
  let getterExecutions = 0;
  Object.defineProperty(observations.replays[0].result, "unexpectedDetail", {
    enumerable: true,
    get() {
      getterExecutions += 1;
      return "Synthetic request conflict body.";
    }
  });

  const report = evaluateContextQualityObservations(corpus, observations);

  assert.equal(report.verdict, "FAIL");
  assert.equal(report.metrics.sourceBodyLeakage, 1);
  assert.equal(getterExecutions, 0);
});

test("Context Quality Eval v0 fails closed on top-level revoked and boundary accessor results", () => {
  const revokedObservations = structuredClone(collectContextQualityObservations(corpus));
  const revoked = Proxy.revocable(revokedObservations.replays[0].result, {});
  revokedObservations.replays[0].result = revoked.proxy;
  revoked.revoke();
  let revokedReport;

  assert.doesNotThrow(() => {
    revokedReport = evaluateContextQualityObservations(corpus, revokedObservations);
  });
  assert.equal(revokedReport.verdict, "FAIL");
  assert.ok(revokedReport.metrics.sourceBodyLeakage > 0);
  assert.ok(revokedReport.metrics.replayViolations > 0);

  const accessorObservations = structuredClone(collectContextQualityObservations(corpus));
  const wrongOwner = accessorObservations.boundaries.find(
    (observation) => observation.caseId === "boundary_wrong_owner"
  );
  let getterExecutions = 0;
  Object.defineProperty(wrongOwner.result, "unexpectedDetail", {
    enumerable: true,
    get() {
      getterExecutions += 1;
      return "foreign-owner-metadata";
    }
  });
  let accessorReport;

  assert.doesNotThrow(() => {
    accessorReport = evaluateContextQualityObservations(corpus, accessorObservations);
  });
  assert.equal(accessorReport.verdict, "FAIL");
  assert.ok(accessorReport.metrics.sourceBodyLeakage > 0);
  assert.ok(accessorReport.metrics.adversarialEscapes > 0);
  assert.equal(getterExecutions, 0);
});

test("Context Quality Eval v0 rejects recursive Proxy result graphs without traps", () => {
  for (const location of ["top_level", "nested"]) {
    const observations = structuredClone(collectContextQualityObservations(corpus));
    let trapExecutions = 0;
    const target = location === "top_level" ? observations.replays[0].result : observations.replays[0].result.audit;
    const proxy = new Proxy(target, {
      getOwnPropertyDescriptor(proxyTarget, key) {
        trapExecutions += 1;
        return Reflect.getOwnPropertyDescriptor(proxyTarget, key);
      },
      getPrototypeOf(proxyTarget) {
        trapExecutions += 1;
        return Reflect.getPrototypeOf(proxyTarget);
      },
      ownKeys(proxyTarget) {
        trapExecutions += 1;
        return Reflect.ownKeys(proxyTarget);
      }
    });
    if (location === "top_level") observations.replays[0].result = proxy;
    else observations.replays[0].result.audit = proxy;

    const report = evaluateContextQualityObservations(corpus, observations);

    assert.equal(report.verdict, "FAIL", location);
    assert.ok(report.metrics.sourceBodyLeakage > 0, location);
    assert.ok(report.metrics.replayViolations > 0, location);
    assert.equal(trapExecutions, 0, location);
  }
});

test("Context Quality Eval v0 rejects non-canonical result projection fields", () => {
  const mutations = [
    {
      name: "hidden_evidence",
      apply(result) {
        Object.defineProperty(result.contextEvidence[0], "unexpectedDetail", {
          value: "synthetic-hidden",
          enumerable: false
        });
      }
    },
    {
      name: "symbol_evidence",
      apply(result) {
        result.contextEvidence[0][Symbol("unexpectedDetail")] = "synthetic-symbol";
      }
    },
    {
      name: "citation_array_extra",
      apply(result) {
        result.citations.unexpectedDetail = "synthetic-array-extra";
      }
    },
    {
      name: "top_level_extra",
      apply(result) {
        result.unexpectedDetail = "synthetic-top-level-extra";
      }
    }
  ];

  for (const mutation of mutations) {
    const observations = structuredClone(collectContextQualityObservations(corpus));
    mutation.apply(observations.searches[0].result);

    const report = evaluateContextQualityObservations(corpus, observations);

    assert.equal(report.verdict, "FAIL", mutation.name);
    assert.ok(
      report.metrics.unhandledCases > 0 || report.metrics.citationProvenanceFidelity < 1,
      mutation.name
    );
  }
});

test("Context Quality Eval v0 fails closed without throwing on sparse result arrays", () => {
  for (const target of ["context_evidence", "state_entries"]) {
    const observations = structuredClone(collectContextQualityObservations(corpus));
    if (target === "context_evidence") {
      observations.searches[0].result.contextEvidence = new Array(1);
    } else {
      observations.captures[0].result.state.entries = new Array(1);
    }
    let report;

    assert.doesNotThrow(() => {
      report = evaluateContextQualityObservations(corpus, observations);
    });
    assert.equal(report.verdict, "FAIL", target);
    assert.ok(report.metrics.unhandledCases > 0, target);
  }
});

test("Context Quality Eval v0 fails closed on null and undefined result state", () => {
  for (const stateValue of [null, undefined]) {
    const observations = structuredClone(collectContextQualityObservations(corpus));
    observations.captures[0].result.state = stateValue;
    let report;

    assert.doesNotThrow(() => {
      report = evaluateContextQualityObservations(corpus, observations);
    });
    assert.equal(report.verdict, "FAIL");
    assert.ok(report.metrics.unhandledCases > 0);
  }
});

test("Context Quality Eval v0 pins array contents, cardinality, and descriptors", () => {
  const mutations = [
    {
      name: "gap_value",
      apply(observations) {
        observations.searches[0].result.gapKinds.push("synthetic_gap");
      }
    },
    {
      name: "capture_state_duplicate",
      apply(observations) {
        const entries = observations.captures[0].result.state.entries;
        entries.push(entries[0]);
      }
    },
    {
      name: "replay_state_duplicate",
      apply(observations) {
        const entries = observations.replays[0].result.state.entries;
        entries.push(entries[0]);
      }
    },
    {
      name: "hidden_evidence_index",
      apply(observations) {
        const evidence = observations.searches[0].result.contextEvidence;
        Object.defineProperty(evidence, "0", { value: evidence[0], enumerable: false });
      }
    },
    {
      name: "hidden_state_index",
      apply(observations) {
        const entries = observations.replays[0].result.state.entries;
        Object.defineProperty(entries, "0", { value: entries[0], enumerable: false });
      }
    }
  ];

  for (const mutation of mutations) {
    const observations = structuredClone(collectContextQualityObservations(corpus));
    mutation.apply(observations);
    const report = evaluateContextQualityObservations(corpus, observations);
    assert.equal(report.verdict, "FAIL", mutation.name);
    assert.ok(report.metrics.unhandledCases > 0, mutation.name);
  }
});

test("Context Quality Eval v0 pins governance and lifecycle result values", () => {
  const mutations = [
    (observations) => {
      observations.searches[0].result.audit.leakedContent = true;
    },
    (observations) => {
      observations.searches[0].result.audit.result = "denied";
    },
    (observations) => {
      observations.searches[0].result.sourceWireHostsUserMemory = true;
    },
    (observations) => {
      observations.captures[0].result.trustedMemoryReturned = true;
    },
    (observations) => {
      observations.captures[0].result.sourceEvidenceReturned = true;
    },
    (observations) => {
      observations.replays[0].result.noAutoPromotion = false;
    }
  ];

  for (const [index, mutate] of mutations.entries()) {
    const observations = structuredClone(collectContextQualityObservations(corpus));
    mutate(observations);
    const report = evaluateContextQualityObservations(corpus, observations);
    assert.equal(report.verdict, "FAIL", `governance mutation ${index}`);
    assert.ok(report.metrics.unhandledCases > 0, `governance mutation ${index}`);
  }
});

test("Context Quality Eval v0 rejects an incomplete required case matrix", () => {
  const incomplete = structuredClone(corpus);
  incomplete.boundaryCases = incomplete.boundaryCases.filter(
    (entry) => entry.caseId !== "boundary_malformed_state"
  );

  assert.throws(
    () => collectContextQualityObservations(incomplete),
    /context quality eval case matrix invalid/
  );
});

test("Context Quality Eval v0 reports a missing required observation", () => {
  const observations = structuredClone(collectContextQualityObservations(corpus));
  observations.boundaries = observations.boundaries.filter(
    (entry) => entry.caseId !== "boundary_malformed_state"
  );

  const report = evaluateContextQualityObservations(corpus, observations);

  assert.equal(report.verdict, "FAIL");
  assert.ok(report.metrics.unhandledCases > 0);
  assert.ok(
    report.failures.some(
      (failure) =>
        failure.caseId === "boundary_malformed_state" &&
        failure.dimension === "unhandled_cases"
    )
  );
});

test("Context Quality Eval v0 counts duplicate evidence identity once per metric", () => {
  const observations = structuredClone(collectContextQualityObservations(corpus));
  const broadSearch = observations.searches.find(
    (observation) => observation.caseId === "search_broad_synthetic_metadata"
  );
  const duplicate = broadSearch.result.contextEvidence[0];
  broadSearch.result.contextEvidence = [duplicate, duplicate, duplicate];

  const report = evaluateContextQualityObservations(corpus, observations);

  assert.equal(report.verdict, "FAIL");
  assert.ok(report.metrics.precisionAtK < 1);
  assert.ok(report.metrics.recallAtK < 1);
});

test("Context Quality Eval v0 rejects a weakened expected-evidence oracle", () => {
  const weakened = structuredClone(corpus);
  weakened.searchCases[0].query = "reviewer_nonexistent_metadata";
  weakened.searchCases[0].expectedEvidence = [];

  assert.throws(
    () => collectContextQualityObservations(weakened),
    /context quality eval corpus oracle invalid/
  );
});

test("Context Quality Eval v0 uses K as the precision denominator", () => {
  const observations = structuredClone(collectContextQualityObservations(corpus));
  const broadSearch = observations.searches.find(
    (observation) => observation.caseId === "search_broad_synthetic_metadata"
  );
  broadSearch.result.contextEvidence = broadSearch.result.contextEvidence.slice(0, 1);
  broadSearch.result.citations = broadSearch.result.citations.slice(0, 1);
  broadSearch.result.citationCount = 1;

  const report = evaluateContextQualityObservations(corpus, observations);

  assert.equal(report.verdict, "FAIL");
  assert.ok(report.metrics.precisionAtK < 1);
  assert.ok(report.metrics.recallAtK < 1);
});
