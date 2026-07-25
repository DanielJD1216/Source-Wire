import type { SourceWireKnowledgeProviderV1 } from "@source-wire/contracts";

import {
  createKnowledgeProviderHost,
  type KnowledgeProviderBinding,
  type ProviderReadAuditStore,
  type ProviderReadStageHook
} from "./knowledge-provider-host.js";

export type AlphaKnowledgeProviderComposition = Readonly<{
  provider: SourceWireKnowledgeProviderV1;
  ownerId: string;
  namespaceId: string;
  providerScopeId: string;
  timeoutMs: number;
}>;

export type AlphaRuntimeComposition = Readonly<{
  knowledgeProvider?: AlphaKnowledgeProviderComposition;
}>;

export function createAlphaRuntimeComposition(
  knowledgeProvider?: AlphaKnowledgeProviderComposition
): AlphaRuntimeComposition {
  if (!knowledgeProvider) return Object.freeze({});
  const immutableBinding: AlphaKnowledgeProviderComposition = Object.freeze({
    provider: knowledgeProvider.provider,
    ownerId: knowledgeProvider.ownerId,
    namespaceId: knowledgeProvider.namespaceId,
    providerScopeId: knowledgeProvider.providerScopeId,
    timeoutMs: knowledgeProvider.timeoutMs
  });
  return Object.freeze({ knowledgeProvider: immutableBinding });
}

export function createComposedKnowledgeProviderHost(options: {
  composition: AlphaRuntimeComposition;
  auditStore: ProviderReadAuditStore;
  processReleaseSecret: Buffer;
  onStage?: ProviderReadStageHook;
}) {
  const binding = options.composition.knowledgeProvider as
    | KnowledgeProviderBinding
    | undefined;
  return createKnowledgeProviderHost({
    ...(binding ? { binding } : {}),
    auditStore: options.auditStore,
    processReleaseSecret: options.processReleaseSecret,
    ...(options.onStage ? { onStage: options.onStage } : {})
  });
}
