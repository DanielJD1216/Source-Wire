export type SourceWireDatabasePostureDataClass =
  | "source_evidence"
  | "memory_candidate"
  | "trusted_memory"
  | "audit_event"
  | "embedding_vector"
  | "search_cache"
  | "backup_snapshot"
  | "export_bundle";

export type SourceWireDatabasePostureTrustLevel =
  | "raw_source"
  | "candidate"
  | "trusted"
  | "operational"
  | "derived"
  | "backup"
  | "export";

export type SourceWireDatabasePostureLifecycleState =
  | "submitted"
  | "indexed"
  | "prepared"
  | "approved"
  | "rejected"
  | "revoked"
  | "deleted"
  | "retained"
  | "stale"
  | "restored";

export type SourceWireDatabasePostureOperation =
  | "read_data_class"
  | "transition_lifecycle"
  | "summarize_retention"
  | "request_deletion"
  | "validate_backup"
  | "validate_restore"
  | "validate_inheritance";

export type SourceWireDatabasePostureStatus = "allowed" | "denied" | "partial_success" | "owner_review_required";

export type SourceWireDatabasePostureDataClassDefinition = {
  dataClass: SourceWireDatabasePostureDataClass;
  trustLevel: SourceWireDatabasePostureTrustLevel;
  lifecycleController: "owner" | "owner_application" | "system";
  storesRawSourceEvidence: boolean;
  storesTrustedMemory: boolean;
  storesDerivedData: boolean;
  inheritsNamespaceFromParent: boolean;
};

export type SourceWireDatabasePostureCase = {
  caseId: string;
  operation: SourceWireDatabasePostureOperation;
  dataClass: SourceWireDatabasePostureDataClass;
  ownerId: string;
  namespaceId: string;
  requestedOwnerId: string;
  requestedNamespaceId: string;
  parentDataClass?: SourceWireDatabasePostureDataClass;
  parentOwnerId?: string;
  parentNamespaceId?: string;
  lifecycleFrom?: SourceWireDatabasePostureLifecycleState;
  lifecycleTo?: SourceWireDatabasePostureLifecycleState;
  explicitTrustedMemoryApproval: boolean;
  deletionRequested: boolean;
  retentionPolicyPresent: boolean;
  backupRestoreContext: "none" | "same_owner_namespace" | "cross_owner_or_namespace";
  expected: Partial<
    Pick<
      SourceWireDatabasePostureResult,
      | "status"
      | "denialReason"
      | "namespaceIsolated"
      | "contentLeaked"
      | "sourceEvidencePromoted"
      | "trustedMemoryCreated"
      | "dependentCitationsMarkedStale"
      | "retentionPolicySummarized"
      | "backupBoundaryPreserved"
      | "restoreRequiresCandidateReview"
      | "parentNamespaceInherited"
      | "databaseMigrationCreated"
      | "realDatabaseConnectionOpened"
    >
  >;
};

export type SourceWireDatabasePostureResult = {
  caseId: string;
  operation: SourceWireDatabasePostureOperation;
  dataClass: SourceWireDatabasePostureDataClass;
  status: SourceWireDatabasePostureStatus;
  denialReason?: string;
  ownerId: string;
  namespaceId: string;
  requestedOwnerId: string;
  requestedNamespaceId: string;
  namespaceIsolated: boolean;
  contentLeaked: false;
  sourceEvidencePromoted: false;
  trustedMemoryCreated: boolean;
  dependentCitationsMarkedStale: boolean;
  retentionPolicySummarized: boolean;
  backupBoundaryPreserved: boolean;
  restoreRequiresCandidateReview: boolean;
  parentNamespaceInherited: boolean;
  databaseMigrationCreated: false;
  realDatabaseConnectionOpened: false;
  postgresOrPgvectorSetupCreated: false;
  sourceWireHostsUserMemory: false;
  runtimeMode: "synthetic_database_posture_package";
  boundary: typeof SOURCE_WIRE_DATABASE_POSTURE_BOUNDARY;
};

export type SourceWireDatabasePostureFixtureMatrix = {
  fixtureType: "source-wire-database-posture-fixture-matrix";
  fixtureSafety: "synthetic";
  boundary: typeof SOURCE_WIRE_DATABASE_POSTURE_BOUNDARY;
  dataClasses: SourceWireDatabasePostureDataClassDefinition[];
  cases: SourceWireDatabasePostureCase[];
};

export const SOURCE_WIRE_DATABASE_POSTURE_BOUNDARY = {
  implementationMode: "synthetic_database_posture_package",
  sourceWireHostsUserMemory: false,
  databaseMigrationsIncluded: false,
  realDatabaseConnectionsIncluded: false,
  postgresOrPgvectorSetupIncluded: false,
  apiServerIncluded: false,
  mcpServerRuntimeIncluded: false,
  liveConnectorsIncluded: false,
  missionControlIncluded: false,
  deploymentIncluded: false,
  hostedServicesIncluded: false,
  managedHostingIncluded: false,
  realDataIncluded: false,
  clientDataIncluded: false,
  privateImplementationCodeIncluded: false,
  agplCodeIncluded: false,
  sourceEvidenceMayAutoPromoteToTrustedMemory: false,
  trustedMemoryPromotion: "owner_or_application_controlled"
} as const;

export const SOURCE_WIRE_DATABASE_POSTURE_DATA_CLASSES: SourceWireDatabasePostureDataClassDefinition[] = [
  {
    dataClass: "source_evidence",
    trustLevel: "raw_source",
    lifecycleController: "owner",
    storesRawSourceEvidence: true,
    storesTrustedMemory: false,
    storesDerivedData: false,
    inheritsNamespaceFromParent: false
  },
  {
    dataClass: "memory_candidate",
    trustLevel: "candidate",
    lifecycleController: "owner_application",
    storesRawSourceEvidence: false,
    storesTrustedMemory: false,
    storesDerivedData: true,
    inheritsNamespaceFromParent: false
  },
  {
    dataClass: "trusted_memory",
    trustLevel: "trusted",
    lifecycleController: "owner_application",
    storesRawSourceEvidence: false,
    storesTrustedMemory: true,
    storesDerivedData: false,
    inheritsNamespaceFromParent: false
  },
  {
    dataClass: "audit_event",
    trustLevel: "operational",
    lifecycleController: "system",
    storesRawSourceEvidence: false,
    storesTrustedMemory: false,
    storesDerivedData: false,
    inheritsNamespaceFromParent: false
  },
  {
    dataClass: "embedding_vector",
    trustLevel: "derived",
    lifecycleController: "system",
    storesRawSourceEvidence: false,
    storesTrustedMemory: false,
    storesDerivedData: true,
    inheritsNamespaceFromParent: true
  },
  {
    dataClass: "search_cache",
    trustLevel: "derived",
    lifecycleController: "system",
    storesRawSourceEvidence: false,
    storesTrustedMemory: false,
    storesDerivedData: true,
    inheritsNamespaceFromParent: true
  },
  {
    dataClass: "backup_snapshot",
    trustLevel: "backup",
    lifecycleController: "owner",
    storesRawSourceEvidence: false,
    storesTrustedMemory: false,
    storesDerivedData: false,
    inheritsNamespaceFromParent: false
  },
  {
    dataClass: "export_bundle",
    trustLevel: "export",
    lifecycleController: "owner",
    storesRawSourceEvidence: false,
    storesTrustedMemory: false,
    storesDerivedData: false,
    inheritsNamespaceFromParent: false
  }
];

export function evaluateDatabasePostureCase(
  postureCase: SourceWireDatabasePostureCase
): SourceWireDatabasePostureResult {
  if (
    postureCase.ownerId !== postureCase.requestedOwnerId ||
    postureCase.namespaceId !== postureCase.requestedNamespaceId
  ) {
    return result(postureCase, "denied", {
      denialReason: "owner_or_namespace_not_allowed",
      namespaceIsolated: true
    });
  }

  if (postureCase.operation === "read_data_class") {
    return result(postureCase, "allowed", { namespaceIsolated: true });
  }

  if (postureCase.operation === "summarize_retention") {
    return result(postureCase, postureCase.retentionPolicyPresent ? "allowed" : "partial_success", {
      retentionPolicySummarized: true
    });
  }

  if (postureCase.operation === "request_deletion") {
    return result(postureCase, "partial_success", {
      dependentCitationsMarkedStale: postureCase.deletionRequested
    });
  }

  if (postureCase.operation === "validate_backup") {
    return result(postureCase, "allowed", {
      backupBoundaryPreserved: postureCase.backupRestoreContext === "same_owner_namespace"
    });
  }

  if (postureCase.operation === "validate_restore") {
    return result(postureCase, "owner_review_required", {
      denialReason: "restore_requires_candidate_review",
      restoreRequiresCandidateReview: true
    });
  }

  if (postureCase.operation === "validate_inheritance") {
    const parentMatches =
      postureCase.parentOwnerId === postureCase.ownerId &&
      postureCase.parentNamespaceId === postureCase.namespaceId;

    if (!parentMatches) {
      return result(postureCase, "denied", {
        denialReason: "parent_owner_or_namespace_mismatch",
        parentNamespaceInherited: false
      });
    }

    return result(postureCase, "allowed", {
      parentNamespaceInherited: true
    });
  }

  if (postureCase.operation === "transition_lifecycle") {
    if (
      postureCase.dataClass === "source_evidence" &&
      postureCase.lifecycleFrom === "submitted" &&
      postureCase.lifecycleTo === "indexed"
    ) {
      return result(postureCase, "allowed");
    }

    if (
      postureCase.dataClass === "memory_candidate" &&
      postureCase.lifecycleFrom === "prepared" &&
      postureCase.lifecycleTo === "approved"
    ) {
      if (!postureCase.explicitTrustedMemoryApproval) {
        return result(postureCase, "owner_review_required", {
          denialReason: "candidate_approval_requires_explicit_owner_or_application_control"
        });
      }

      return result(postureCase, "allowed", {
        trustedMemoryCreated: true
      });
    }

    if (
      postureCase.dataClass === "memory_candidate" &&
      postureCase.lifecycleFrom === "prepared" &&
      postureCase.lifecycleTo === "rejected"
    ) {
      return result(postureCase, "allowed");
    }

    if (
      postureCase.dataClass === "trusted_memory" &&
      postureCase.lifecycleFrom === "approved" &&
      (postureCase.lifecycleTo === "revoked" || postureCase.lifecycleTo === "deleted")
    ) {
      return result(postureCase, "partial_success", {
        dependentCitationsMarkedStale: true
      });
    }
  }

  return result(postureCase, "denied", {
    denialReason: "unsupported_synthetic_database_posture_case"
  });
}

export function evaluateDatabasePostureFixtureMatrix(
  matrix: SourceWireDatabasePostureFixtureMatrix
): SourceWireDatabasePostureResult[] {
  return matrix.cases.map((postureCase) => evaluateDatabasePostureCase(postureCase));
}

function result(
  postureCase: SourceWireDatabasePostureCase,
  status: SourceWireDatabasePostureStatus,
  overrides: Partial<SourceWireDatabasePostureResult> = {}
): SourceWireDatabasePostureResult {
  const base: SourceWireDatabasePostureResult = {
    caseId: postureCase.caseId,
    operation: postureCase.operation,
    dataClass: postureCase.dataClass,
    status,
    ownerId: postureCase.ownerId,
    namespaceId: postureCase.namespaceId,
    requestedOwnerId: postureCase.requestedOwnerId,
    requestedNamespaceId: postureCase.requestedNamespaceId,
    namespaceIsolated: postureCase.ownerId === postureCase.requestedOwnerId &&
      postureCase.namespaceId === postureCase.requestedNamespaceId,
    contentLeaked: false,
    sourceEvidencePromoted: false,
    trustedMemoryCreated: false,
    dependentCitationsMarkedStale: false,
    retentionPolicySummarized: false,
    backupBoundaryPreserved: false,
    restoreRequiresCandidateReview: false,
    parentNamespaceInherited: false,
    databaseMigrationCreated: false,
    realDatabaseConnectionOpened: false,
    postgresOrPgvectorSetupCreated: false,
    sourceWireHostsUserMemory: false,
    runtimeMode: "synthetic_database_posture_package",
    boundary: SOURCE_WIRE_DATABASE_POSTURE_BOUNDARY
  };

  return {
    ...base,
    ...overrides,
    contentLeaked: false,
    sourceEvidencePromoted: false,
    databaseMigrationCreated: false,
    realDatabaseConnectionOpened: false,
    postgresOrPgvectorSetupCreated: false,
    sourceWireHostsUserMemory: false
  };
}
