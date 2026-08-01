import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type McpToolProfile =
  | "gate_b_memory_only"
  | "memory_only"
  | "provider";

const allowedToolNames: Readonly<
  Record<McpToolProfile, readonly string[]>
> = Object.freeze({
  gate_b_memory_only: Object.freeze(["search_trusted_memory"]),
  memory_only: Object.freeze([
    "propose_memory_candidate",
    "search_trusted_memory"
  ]),
  provider: Object.freeze([
    "get_source_evidence",
    "search_source_evidence",
    "propose_memory_candidate",
    "search_trusted_memory"
  ])
});

type McpServerConstructorArguments = ConstructorParameters<typeof McpServer>;
export type ProfileRestrictedMcpServer = Readonly<
  Pick<McpServer, "close" | "connect" | "registerTool">
>;

export function readToolProfile(value: string | undefined): McpToolProfile {
  if (value === undefined || value === "provider") return "provider";
  if (value === "memory_only") return "memory_only";
  if (value === "gate_b_memory_only") return "gate_b_memory_only";
  throw new Error("invalid_mcp_tool_profile");
}

export function assertToolAllowed(
  profile: McpToolProfile,
  name: string
): void {
  if (!allowedToolNames[profile].includes(name)) {
    throw new Error("mcp_tool_not_allowed_for_profile");
  }
}

export function createProfileRestrictedMcpServer(
  serverInfo: McpServerConstructorArguments[0],
  options: McpServerConstructorArguments[1],
  profile: McpToolProfile
): ProfileRestrictedMcpServer {
  const inner = new McpServer(serverInfo, options);
  const registerTool = ((name: string, ...args: unknown[]): unknown => {
    assertToolAllowed(profile, name);
    return Reflect.apply(inner.registerTool, inner, [name, ...args]);
  }) as McpServer["registerTool"];
  const facade = Object.assign(Object.create(null) as object, {
    close: inner.close.bind(inner),
    connect: inner.connect.bind(inner),
    registerTool
  }) as ProfileRestrictedMcpServer;
  return Object.freeze(facade);
}
