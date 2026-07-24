export type Story5KnowledgeProviderSecurityPolicy = Readonly<{
  providerBinding: "optional_single_immutable";
  namespaceAuthority: "authenticated_credential";
  requiredCapability: "source_evidence.read";
  mcpTools: readonly Readonly<{
    name: "search_source_evidence" | "get_source_evidence";
    providerOperation: "search_evidence" | "get_evidence";
  }>[];
  callerSelectableAuthorityFields: readonly string[];
  blockedSurfaces: Readonly<{
    providerRegistry: true;
    dynamicProviderLoading: true;
    liveConnector: true;
    deployment: true;
    realData: true;
    automaticTrustedMemoryPromotion: true;
  }>;
}>;

export const STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY: Story5KnowledgeProviderSecurityPolicy =
  Object.freeze({
    providerBinding: "optional_single_immutable",
    namespaceAuthority: "authenticated_credential",
    requiredCapability: "source_evidence.read",
    mcpTools: Object.freeze([
      Object.freeze({
        name: "search_source_evidence",
        providerOperation: "search_evidence"
      }),
      Object.freeze({
        name: "get_source_evidence",
        providerOperation: "get_evidence"
      })
    ]),
    callerSelectableAuthorityFields: Object.freeze([]),
    blockedSurfaces: Object.freeze({
      providerRegistry: true,
      dynamicProviderLoading: true,
      liveConnector: true,
      deployment: true,
      realData: true,
      automaticTrustedMemoryPromotion: true
    })
  });

const CALLER_FORBIDDEN_PROVIDER_AUTHORITY_FIELDS = new Set([
  "aclDecision",
  "authority",
  "ownerId",
  "providerCredentials",
  "providerEndpoint",
  "providerId",
  "providerScopeId"
]);

export function assertStory5KnowledgeProviderSecurityPolicy(
  policy: Story5KnowledgeProviderSecurityPolicy
): void {
  if (
    policy.providerBinding !== "optional_single_immutable" ||
    policy.namespaceAuthority !== "authenticated_credential" ||
    policy.requiredCapability !== "source_evidence.read" ||
    policy.callerSelectableAuthorityFields.length !== 0 ||
    policy.mcpTools.length !== 2 ||
    policy.mcpTools[0]?.name !== "search_source_evidence" ||
    policy.mcpTools[0]?.providerOperation !== "search_evidence" ||
    policy.mcpTools[1]?.name !== "get_source_evidence" ||
    policy.mcpTools[1]?.providerOperation !== "get_evidence" ||
    !Object.values(policy.blockedSurfaces).every((blocked) => blocked === true)
  ) {
    throw new Error("story5_security_policy_invalid");
  }
}

export function assertNoCallerSelectableProviderAuthority(input: unknown): void {
  visitCallerInput(input, new WeakSet<object>());
}

function visitCallerInput(input: unknown, visited: WeakSet<object>): void {
  if (input === null || typeof input !== "object") return;
  if (visited.has(input)) return;
  visited.add(input);

  if (Array.isArray(input)) {
    for (const value of input) visitCallerInput(value, visited);
    return;
  }

  for (const [key, value] of Object.entries(input)) {
    if (CALLER_FORBIDDEN_PROVIDER_AUTHORITY_FIELDS.has(key)) {
      throw new Error("caller_provider_authority_forbidden");
    }
    visitCallerInput(value, visited);
  }
}
