const ownerNamespace = "synthetic-owner";
const clientNamespace = "synthetic-client";

const runtimeState = {
  trustedMemoryCount: 1,
  pendingCandidateCount: 0,
  allowedCredentials: new Map([
    ["read-credential", { namespaces: [ownerNamespace], scopes: ["read_memory", "read_sources"] }],
    ["maintain-credential", { namespaces: [ownerNamespace], scopes: ["read_memory", "read_sources", "import_sources"] }],
    ["client-credential", { namespaces: [clientNamespace], scopes: ["read_memory", "read_sources"] }]
  ]),
  sourceEvidence: [
    {
      namespace: ownerNamespace,
      title: "Synthetic Project Source",
      locator: "synthetic-source.md#workflow",
      content: "The project workflow is intake, review, answer, and owner approval."
    }
  ]
};

const authorizedRead = mcpUseSecondBrain({
  credential: "read-credential",
  namespace: ownerNamespace,
  action: "answer"
});

assertEqual(authorizedRead.ok, true, "authorized read should pass");
assertEqual(authorizedRead.response.answer.includes("intake"), true, "authorized read should return cited answer");
assertEqual(authorizedRead.response.citations.length, 1, "authorized read should include one citation");
assertEqual(authorizedRead.audit.boundary, "mcp_to_api", "MCP must call API boundary");

const unauthorizedRead = mcpUseSecondBrain({
  credential: "missing-credential",
  namespace: ownerNamespace,
  action: "answer"
});

assertEqual(unauthorizedRead.ok, false, "unauthorized read should fail");
assertEqual(unauthorizedRead.status, 401, "unauthorized read should fail closed");
assertEqual(unauthorizedRead.audit.leakedContent, false, "unauthorized read must not leak content");

const wrongNamespace = mcpUseSecondBrain({
  credential: "client-credential",
  namespace: ownerNamespace,
  action: "answer"
});

assertEqual(wrongNamespace.ok, false, "wrong namespace should fail");
assertEqual(wrongNamespace.status, 403, "wrong namespace should be forbidden");
assertEqual(wrongNamespace.audit.deniedEvidenceCount, 1, "wrong namespace should count denied evidence");
assertEqual(wrongNamespace.audit.leakedContent, false, "wrong namespace must not leak content");

const beforeMaintenanceTrustedCount = runtimeState.trustedMemoryCount;
const maintenance = mcpMaintainSource({
  credential: "maintain-credential",
  namespace: ownerNamespace,
  action: "maintain_source"
});

assertEqual(maintenance.ok, true, "maintenance should pass for import scope");
assertEqual(maintenance.response.noAutoPromotion, true, "maintenance must preserve noAutoPromotion");
assertEqual(maintenance.response.pendingCandidateCount, 1, "maintenance should create pending candidate");
assertEqual(runtimeState.trustedMemoryCount, beforeMaintenanceTrustedCount, "maintenance must not create trusted memory");
assertEqual(runtimeState.pendingCandidateCount, 1, "pending candidate count should increase");

const approval = apiApproveTrustedMemory({
  credential: "maintain-credential",
  namespace: ownerNamespace,
  actorType: "owner"
});

assertEqual(approval.ok, true, "owner approval should pass");
assertEqual(approval.response.approvalControlledBy, "owner_or_application", "approval must be owner or application controlled");
assertEqual(runtimeState.trustedMemoryCount, beforeMaintenanceTrustedCount + 1, "approval should create trusted memory");

const deniedApproval = apiApproveTrustedMemory({
  credential: "read-credential",
  namespace: ownerNamespace,
  actorType: "agent"
});

assertEqual(deniedApproval.ok, false, "agent approval should fail");
assertEqual(deniedApproval.status, 403, "agent approval should be forbidden by default");

console.log("ok synthetic runtime boundary smoke");

function mcpUseSecondBrain(request) {
  return apiBoundary({
    ...request,
    requiredScope: "read_memory",
    boundary: "mcp_to_api"
  });
}

function mcpMaintainSource(request) {
  return apiBoundary({
    ...request,
    requiredScope: "import_sources",
    boundary: "mcp_to_api"
  });
}

function apiBoundary(request) {
  const access = runtimeState.allowedCredentials.get(request.credential);
  const baseAudit = {
    boundary: request.boundary,
    namespace: request.namespace,
    action: request.action,
    leakedContent: false
  };

  if (!access) {
    return {
      ok: false,
      status: 401,
      audit: {
        ...baseAudit,
        result: "denied_missing_credential"
      }
    };
  }

  if (!access.namespaces.includes(request.namespace)) {
    return {
      ok: false,
      status: 403,
      audit: {
        ...baseAudit,
        result: "denied_wrong_namespace",
        deniedEvidenceCount: runtimeState.sourceEvidence.length
      }
    };
  }

  if (!access.scopes.includes(request.requiredScope)) {
    return {
      ok: false,
      status: 403,
      audit: {
        ...baseAudit,
        result: "denied_missing_scope"
      }
    };
  }

  if (request.action === "maintain_source") {
    runtimeState.pendingCandidateCount += 1;
    return {
      ok: true,
      status: 200,
      response: {
        contractVersion: "source-maintenance.v1",
        changedSourceCount: 1,
        pendingCandidateCount: runtimeState.pendingCandidateCount,
        trustedMemoryDelta: 0,
        noAutoPromotion: true
      },
      audit: {
        ...baseAudit,
        result: "maintained_source"
      }
    };
  }

  const evidence = runtimeState.sourceEvidence.find((entry) => entry.namespace === request.namespace);

  return {
    ok: true,
    status: 200,
    response: {
      contractVersion: "second-brain.v1",
      answer: evidence?.content ?? "No synthetic evidence found.",
      sourceEvidenceTrust: "evidence_only",
      trustedMemoryTrust: "approved_memory_only",
      citations: evidence
        ? [
            {
              type: "source_segment",
              sourceTitle: evidence.title,
              locator: evidence.locator
            }
          ]
        : [],
      noAutoPromotion: true
    },
    audit: {
      ...baseAudit,
      result: "answered_with_citations"
    }
  };
}

function apiApproveTrustedMemory(request) {
  const access = runtimeState.allowedCredentials.get(request.credential);
  const baseAudit = {
    boundary: "api_only",
    namespace: request.namespace,
    action: "approve_trusted_memory",
    leakedContent: false
  };

  if (!access || !access.namespaces.includes(request.namespace) || request.actorType !== "owner") {
    return {
      ok: false,
      status: 403,
      audit: {
        ...baseAudit,
        result: "denied_approval_boundary"
      }
    };
  }

  runtimeState.trustedMemoryCount += 1;
  return {
    ok: true,
    status: 200,
    response: {
      approvalControlledBy: "owner_or_application",
      trustedMemoryDelta: 1
    },
    audit: {
      ...baseAudit,
      result: "approved_trusted_memory"
    }
  };
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
