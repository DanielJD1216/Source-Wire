import {
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
  type SourceWireKnowledgeProviderRequestV1,
  type SourceWireKnowledgeProviderResultV1,
  type SourceWireKnowledgeProviderV1
} from "@source-wire/contracts";
import { randomUUID } from "node:crypto";

import {
  validateKnowledgeProviderBinding,
  type KnowledgeProviderBinding
} from "../knowledge-provider-host.js";
import type {
  SourceWireLocalConfigV1,
  SourceWireLocalKnowledgeProviderConfigV1
} from "./config.js";
import { SourceWireLocalCliError } from "./result.js";

export type LoadedLocalKnowledgeProvider = Readonly<{
  provider: SourceWireKnowledgeProviderV1;
  binding: KnowledgeProviderBinding;
}>;

export async function loadConfiguredKnowledgeProvider(input: {
  config: SourceWireLocalConfigV1;
}): Promise<LoadedLocalKnowledgeProvider> {
  const providerConfig = input.config.knowledgeProvider;
  if (!providerConfig) {
    throw new SourceWireLocalCliError("provider_not_configured");
  }
  if (input.config.namespaces.length !== 1) {
    throw new SourceWireLocalCliError("provider_namespace_invalid");
  }
  return loadKnowledgeProviderBinding({
    providerConfig,
    ownerId: input.config.ownerId,
    namespaceId: input.config.namespaces[0] as string
  });
}

export async function loadKnowledgeProviderBinding(input: {
  providerConfig: SourceWireLocalKnowledgeProviderConfigV1;
  ownerId: string;
  namespaceId: string;
}): Promise<LoadedLocalKnowledgeProvider> {
  const provider = await importProvider(input.providerConfig);
  const binding: KnowledgeProviderBinding = {
    provider,
    ownerId: input.ownerId,
    namespaceId: input.namespaceId,
    providerScopeId: input.providerConfig.providerScopeId,
    timeoutMs: input.providerConfig.timeoutMs
  };
  try {
    validateKnowledgeProviderBinding(binding);
  } catch {
    throw new SourceWireLocalCliError("provider_profile_invalid");
  }
  return Object.freeze({ provider, binding: Object.freeze(binding) });
}

export async function checkKnowledgeProviderReadiness(
  loaded: LoadedLocalKnowledgeProvider
): Promise<void> {
  const requestId = randomUUID();
  const traceId = randomUUID();
  const request: SourceWireKnowledgeProviderRequestV1 = {
    contractId: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
    contractVersion: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
    requestId,
    traceId,
    providerId: loaded.provider.profile.providerId,
    ownerId: loaded.binding.ownerId,
    namespaceId: loaded.binding.namespaceId,
    providerScopeId: loaded.binding.providerScopeId,
    operation: "health",
    requiredCapabilities: [
      {
        capability: "health",
        requirement: "required"
      }
    ],
    deadlineAt: new Date(
      Date.now() + loaded.binding.timeoutMs
    ).toISOString()
  };

  let result: SourceWireKnowledgeProviderResultV1;
  try {
    result = await withTimeout(
      loaded.provider.execute(request),
      loaded.binding.timeoutMs
    );
  } catch {
    throw new SourceWireLocalCliError("provider_readiness_failed");
  }
  if (!isSafeReadinessResult(result, requestId, traceId, loaded)) {
    throw new SourceWireLocalCliError("provider_readiness_failed");
  }
}

async function importProvider(
  config: SourceWireLocalKnowledgeProviderConfigV1
): Promise<SourceWireKnowledgeProviderV1> {
  let imported: Record<string, unknown>;
  try {
    imported = (await import(config.module)) as Record<string, unknown>;
  } catch {
    throw new SourceWireLocalCliError("provider_load_failed");
  }
  const factory = imported[config.exportName];
  if (typeof factory !== "function") {
    throw new SourceWireLocalCliError("provider_load_failed");
  }
  let provider: unknown;
  try {
    provider = await withTimeout(
      Promise.resolve(factory()),
      config.timeoutMs
    );
  } catch {
    throw new SourceWireLocalCliError("provider_load_failed");
  }
  if (
    !provider ||
    typeof provider !== "object" ||
    Array.isArray(provider) ||
    typeof (provider as Record<string, unknown>).execute !== "function" ||
    !(provider as Record<string, unknown>).profile ||
    typeof (provider as Record<string, unknown>).profile !== "object"
  ) {
    throw new SourceWireLocalCliError("provider_load_failed");
  }
  return provider as SourceWireKnowledgeProviderV1;
}

function isSafeReadinessResult(
  result: SourceWireKnowledgeProviderResultV1,
  requestId: string,
  traceId: string,
  loaded: LoadedLocalKnowledgeProvider
): boolean {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return false;
  }
  const keys = Object.keys(result).sort();
  const expectedKeys = [
    "contractVersion",
    "evidence",
    "gaps",
    "memoryMutationAttempted",
    "noAutoPromotion",
    "providerId",
    "providerMutationAttempted",
    "readAuditRequired",
    "releaseState",
    "requestId",
    "status",
    "traceId",
    "trustedMemoryCreated"
  ].sort();
  return (
    JSON.stringify(keys) === JSON.stringify(expectedKeys) &&
    result.requestId === requestId &&
    result.traceId === traceId &&
    result.providerId === loaded.provider.profile.providerId &&
    result.contractVersion ===
      SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION &&
    result.status === "allowed" &&
    Array.isArray(result.evidence) &&
    result.evidence.length === 0 &&
    Array.isArray(result.gaps) &&
    result.gaps.length === 0 &&
    result.providerMutationAttempted === false &&
    result.memoryMutationAttempted === false &&
    result.trustedMemoryCreated === false &&
    result.noAutoPromotion === true &&
    result.readAuditRequired === true &&
    result.releaseState === "internal_unreleased"
  );
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("provider_timeout")),
          timeoutMs
        );
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
