export type SourceWireOwnerHostedSetupStatus = "draft_contract";

export type SourceWireOwnerHostedSetupRequirementKind =
  | "owner_device_or_server"
  | "postgres_compatible_database"
  | "owner_secret_storage"
  | "owner_selected_sources"
  | "mcp_capable_harness"
  | "owner_review_time";

export type SourceWireOwnerHostedSetupRequirement = {
  id: SourceWireOwnerHostedSetupRequirementKind;
  label: string;
  ownerBrings: string;
  plainEnglish: string;
  required: true;
  controlledByOwner: true;
  syntheticProofExpectation: string;
};

export type SourceWireOwnerHostedSetupBoundary = {
  sourceWireHostedMemoryDefault: false;
  managedHostingIncluded: false;
  apiServerRuntimeIncluded: false;
  mcpServerRuntimeIncluded: false;
  databaseMigrationsIncluded: false;
  missionControlIncluded: false;
  deploymentIncluded: false;
  realUserDataIncluded: false;
  automaticTrustedMemoryPromotionIncluded: false;
  agplCodeCopiedIntoSourceWire: false;
  privateImplementationCodeCopiedIntoSourceWire: false;
};

export type SourceWireOwnerHostedSetupStopCondition = {
  id: string;
  stopWhen: string;
  reason: string;
  nextAction: string;
};

export type SourceWireOwnerHostedSetupContract = {
  contractVersion: "source-wire-owner-hosted-setup.v1";
  status: SourceWireOwnerHostedSetupStatus;
  posture: "owner_hosted_byo";
  summary: string;
  requirements: readonly SourceWireOwnerHostedSetupRequirement[];
  boundary: SourceWireOwnerHostedSetupBoundary;
  stopConditions: readonly SourceWireOwnerHostedSetupStopCondition[];
};

export type SourceWireOwnerHostedSetupReadinessSummary = {
  contractVersion: SourceWireOwnerHostedSetupContract["contractVersion"];
  posture: SourceWireOwnerHostedSetupContract["posture"];
  requiredOwnerInputs: number;
  stopConditionCount: number;
  sourceWireHostsMemoryByDefault: false;
  runtimeIncluded: false;
  safeForPublicFixtures: true;
};

export const SOURCE_WIRE_OWNER_HOSTED_SETUP_REQUIREMENTS = [
  {
    id: "owner_device_or_server",
    label: "Owner device or server",
    ownerBrings: "A local machine, private server, or chosen hosted machine that the owner controls.",
    plainEnglish: "Source-Wire does not give the user a memory computer. The owner chooses where it runs.",
    required: true,
    controlledByOwner: true,
    syntheticProofExpectation: "Proof may name only synthetic device/server readiness, never a real private host."
  },
  {
    id: "postgres_compatible_database",
    label: "PostgreSQL-compatible database",
    ownerBrings: "A PostgreSQL-compatible database selected and paid for by the owner when needed.",
    plainEnglish: "The owner brings the database. Source-Wire does not host the memory database by default.",
    required: true,
    controlledByOwner: true,
    syntheticProofExpectation: "Proof may assert database requirement coverage without real connection strings."
  },
  {
    id: "owner_secret_storage",
    label: "Owner-controlled secrets",
    ownerBrings: "Local environment variables, a local secret manager, or another owner-controlled secret store.",
    plainEnglish: "API keys and database passwords stay with the owner, not in public Source-Wire fixtures.",
    required: true,
    controlledByOwner: true,
    syntheticProofExpectation: "Proof must use fake secret references only."
  },
  {
    id: "owner_selected_sources",
    label: "Owner-selected sources",
    ownerBrings: "Explicit source packets or configured source connections selected by the owner.",
    plainEnglish: "Source-Wire should never guess which private folders, chats, or accounts to import.",
    required: true,
    controlledByOwner: true,
    syntheticProofExpectation: "Proof must use synthetic source labels and must not crawl local paths."
  },
  {
    id: "mcp_capable_harness",
    label: "MCP-capable agent harness",
    ownerBrings: "An agent tool or application that can connect to the owner's MCP adapter when a runtime exists.",
    plainEnglish: "The owner decides which agent gets access. MCP must still go through Source-Wire policy.",
    required: true,
    controlledByOwner: true,
    syntheticProofExpectation: "Proof may use fake tool names and must preserve policy routing."
  },
  {
    id: "owner_review_time",
    label: "Owner review time",
    ownerBrings: "Owner attention for approving, rejecting, or correcting candidate memories.",
    plainEnglish: "Agents can suggest memory, but trusted memory promotion stays owner or application controlled.",
    required: true,
    controlledByOwner: true,
    syntheticProofExpectation: "Proof must keep automatic trusted memory promotion off."
  }
] as const satisfies readonly SourceWireOwnerHostedSetupRequirement[];

export const SOURCE_WIRE_OWNER_HOSTED_SETUP_BOUNDARY: SourceWireOwnerHostedSetupBoundary = {
  sourceWireHostedMemoryDefault: false,
  managedHostingIncluded: false,
  apiServerRuntimeIncluded: false,
  mcpServerRuntimeIncluded: false,
  databaseMigrationsIncluded: false,
  missionControlIncluded: false,
  deploymentIncluded: false,
  realUserDataIncluded: false,
  automaticTrustedMemoryPromotionIncluded: false,
  agplCodeCopiedIntoSourceWire: false,
  privateImplementationCodeCopiedIntoSourceWire: false
};

export const SOURCE_WIRE_OWNER_HOSTED_SETUP_STOP_CONDITIONS = [
  {
    id: "real_secret_requested",
    stopWhen: "A fixture, proof, doc, or command asks for a real token, password, API key, or connection string.",
    reason: "Public Source-Wire setup proof must not collect or publish owner secrets.",
    nextAction: "Replace with a fake secret reference and keep real secret handling owner-controlled."
  },
  {
    id: "private_path_or_folder_crawl",
    stopWhen: "A setup step asks to crawl a real local folder, whole vault, provider account, or broad chat history.",
    reason: "Slice 1 is a setup contract, not a private-data import workflow.",
    nextAction: "Use an explicit synthetic source packet or defer import behavior to a later approved runtime unit."
  },
  {
    id: "source_wire_hosted_memory_claim",
    stopWhen: "A doc or fixture implies Source-Wire hosts user memory by default.",
    reason: "The approved product posture is BYO owner-hosted memory.",
    nextAction: "Rewrite the claim to say the owner brings their own runtime and database."
  },
  {
    id: "runtime_or_deployment_started",
    stopWhen: "A setup artifact starts an API server, MCP server, database migration, deployment, or managed service.",
    reason: "Slice 1 has no runtime implementation authority.",
    nextAction: "Stop and open a separate approved runtime implementation unit."
  },
  {
    id: "trusted_memory_auto_promotion",
    stopWhen: "A setup path promotes candidate memory to trusted memory without owner or application control.",
    reason: "Trusted memory promotion must stay explicit and auditable.",
    nextAction: "Return pending candidate state and require owner or application-controlled review."
  },
  {
    id: "agpl_or_private_code_copy",
    stopWhen: "A change copies AGPLv3 memory-engine code or private implementation code into Source-Wire.",
    reason: "Source-Wire keeps the memory engine separate and avoids license contamination.",
    nextAction: "Use a boundary doc, adapter contract, or separate runtime candidate instead."
  }
] as const satisfies readonly SourceWireOwnerHostedSetupStopCondition[];

export const SOURCE_WIRE_OWNER_HOSTED_SETUP_CONTRACT: SourceWireOwnerHostedSetupContract = {
  contractVersion: "source-wire-owner-hosted-setup.v1",
  status: "draft_contract",
  posture: "owner_hosted_byo",
  summary:
    "Source-Wire setup assumes the owner brings the device or server, PostgreSQL-compatible database, secrets, selected sources, MCP-capable harness, and review time.",
  requirements: SOURCE_WIRE_OWNER_HOSTED_SETUP_REQUIREMENTS,
  boundary: SOURCE_WIRE_OWNER_HOSTED_SETUP_BOUNDARY,
  stopConditions: SOURCE_WIRE_OWNER_HOSTED_SETUP_STOP_CONDITIONS
};

export function summarizeOwnerHostedSetupContract(
  contract: SourceWireOwnerHostedSetupContract = SOURCE_WIRE_OWNER_HOSTED_SETUP_CONTRACT
): SourceWireOwnerHostedSetupReadinessSummary {
  return {
    contractVersion: contract.contractVersion,
    posture: contract.posture,
    requiredOwnerInputs: contract.requirements.length,
    stopConditionCount: contract.stopConditions.length,
    sourceWireHostsMemoryByDefault: contract.boundary.sourceWireHostedMemoryDefault,
    runtimeIncluded:
      contract.boundary.apiServerRuntimeIncluded ||
      contract.boundary.mcpServerRuntimeIncluded ||
      contract.boundary.databaseMigrationsIncluded ||
      contract.boundary.deploymentIncluded,
    safeForPublicFixtures: true
  };
}
