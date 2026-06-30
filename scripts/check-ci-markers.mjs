import { readFile } from "node:fs/promises";

const markerGroups = [
  {
    name: "release gate",
    markers: [
      "ok release gate",
      "ok license UNLICENSED",
      "ok version 0.0.0",
      "ok publishing blocked"
    ]
  },
  {
    name: "package required paths",
    markers: ["ok package required paths"]
  },
  {
    name: "license decision record",
    markers: [
      "ok license decision record ready",
      "blocked license decision pending",
      "blocked license implementation missing"
    ]
  },
  {
    name: "license approval request",
    markers: [
      "ok license approval request ready",
      "blocked owner license approval missing",
      "blocked license decision pending"
    ]
  },
  {
    name: "license implementation plan",
    markers: [
      "ok license implementation plan ready",
      "ok license decision paths mapped",
      "blocked license implementation awaiting owner decision"
    ]
  },
  {
    name: "owner license approval preflight",
    markers: [
      "ok owner license approval preflight ready",
      "ok owner approval package complete",
      "blocked owner license approval missing"
    ]
  },
  {
    name: "owner decision workflow",
    markers: [
      "ok owner decision workflow ready",
      "ok owner decision options available",
      "blocked owner license decision missing"
    ]
  },
  {
    name: "legal review packet",
    markers: [
      "ok legal review packet ready",
      "blocked legal approval not granted"
    ]
  },
  {
    name: "owner launch checklist",
    markers: [
      "ok owner launch checklist ready",
      "blocked owner launch approval missing"
    ]
  },
  {
    name: "world-share boundary",
    markers: [
      "ok world share technical review ready",
      "blocked world share broad reuse"
    ]
  },
  {
    name: "first visitor share audit",
    markers: [
      "ok first visitor share audit ready",
      "ok technical review sharing ready",
      "blocked broad public reuse"
    ]
  },
  {
    name: "launch decision status",
    markers: [
      "ok launch decision status ready",
      "ok technical review sharing ready",
      "blocked legal approval not granted",
      "blocked owner launch approval missing",
      "blocked license implementation missing",
      "blocked npm publishing not approved",
      "blocked github release not approved",
      "blocked hosted runtime not approved",
      "blocked contributions not accepted"
    ]
  },
  {
    name: "package dry run",
    markers: [
      "ok package dry-run @source-wire/contracts@0.0.0",
      "ok package file count"
    ]
  },
  {
    name: "package content smoke",
    markers: [
      "ok package content smoke @source-wire/contracts@0.0.0",
      "ok installed required paths",
      "ok installed runtime readiness summary",
      "ok installed runtime readiness summary content",
      "ok installed package docs links"
    ]
  },
  {
    name: "minimal runtime smoke",
    markers: ["ok minimal runtime boundary smoke"]
  },
  {
    name: "runtime boundary smoke",
    markers: [
      "ok runtime boundary check authorized_read",
      "ok runtime boundary check unauthorized_read_denial",
      "ok runtime boundary check wrong_namespace_denial",
      "ok runtime boundary check source_maintenance_no_auto_promotion",
      "ok runtime boundary check owner_controlled_approval",
      "ok runtime boundary check agent_approval_denial",
      "ok synthetic runtime boundary smoke"
    ]
  },
  {
    name: "installed runtime boundary smoke",
    markers: [
      "ok runtime boundary installed smoke @source-wire/contracts@0.0.0",
      "ok installed runtime boundary example"
    ]
  },
  {
    name: "diagnostic regression smoke",
    markers: [
      "ok runtime boundary diagnostics smoke authorized_read",
      "ok diagnostic failure includes check name",
      "ok diagnostic failure includes assertion",
      "ok diagnostic failure includes expected value",
      "ok diagnostic failure includes received value",
      "ok diagnostic failure includes next action"
    ]
  },
  {
    name: "docs and readiness",
    markers: [
      "ok readiness report",
      "ok docs links",
      "ok command docs setup"
    ]
  },
  {
    name: "public safety",
    markers: ["Findings: 0 high=0 medium=0 low=0"]
  },
  {
    name: "public claim boundary",
    markers: ["ok public claim boundary scan"]
  },
  {
    name: "ci marker self-smoke",
    markers: ["ok ci markers smoke"]
  }
];

const logText = await readLogText();
const missing = [];
let presentCount = 0;

for (const group of markerGroups) {
  console.log(`\n${group.name}`);
  console.log("-".repeat(group.name.length));

  for (const marker of group.markers) {
    const line = findMarkerLine(logText, marker);
    if (line) {
      presentCount += 1;
      console.log(`ok ci marker ${marker}`);
      continue;
    }

    missing.push({ group: group.name, marker });
    console.log(`missing ci marker ${marker}`);
  }
}

if (missing.length > 0) {
  console.error("");
  console.error("failed ci markers missing required marker evidence");
  for (const item of missing) {
    console.error(`- ${item.group}: ${item.marker}`);
  }
  process.exit(1);
}

console.log("");
console.log(`ok ci markers ${markerGroups.length} groups ${presentCount} markers`);

async function readLogText() {
  const [inputPath] = process.argv.slice(2);

  if (inputPath && inputPath !== "-") {
    return readFile(inputPath, "utf8");
  }

  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("error", reject);
    process.stdin.on("end", () => resolve(input));
  });
}

function findMarkerLine(logTextToSearch, marker) {
  return logTextToSearch.split(/\r?\n/u).find((line) => line.includes(marker));
}
