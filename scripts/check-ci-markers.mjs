import { readFile } from "node:fs/promises";

const markerGroups = [
  {
    name: "release gate",
    markers: [
      "ok release gate",
      "ok license Apache-2.0",
      "ok package lock Apache-2.0",
      "ok version 0.1.0",
      "ok npm public access ready"
    ]
  },
  {
    name: "release command guard smoke",
    markers: ["ok blocked release commands smoke"]
  },
  {
    name: "release approval request",
    markers: [
      "ok release approval request ready",
      "ok npm publishing completed @source-wire/contracts@0.1.0",
      "ok github release completed v0.1.0",
      "ok version release completed 0.1.0"
    ]
  },
  {
    name: "release auth handoff",
    markers: [
      "ok release auth handoff ready",
      "ok npm authentication owner steps documented",
      "blocked future release auth owner action required"
    ]
  },
  {
    name: "release implementation plan",
    markers: [
      "ok release implementation plan ready",
      "ok release version target documented",
      "ok release execution completed"
    ]
  },
  {
    name: "release publish config plan",
    markers: [
      "ok release publish config plan ready",
      "ok current npm public access documented",
      "blocked future publish config mutation not performed"
    ]
  },
  {
    name: "release implementation preparation",
    markers: [
      "ok release implementation preparation ready",
      "ok release implementation evidence map ready",
      "ok release execution completed"
    ]
  },
  {
    name: "release implementation rehearsal",
    markers: [
      "ok release implementation rehearsal ready",
      "ok future version rehearsal 0.1.0",
      "ok future npm public access rehearsal",
      "ok release metadata applied"
    ]
  },
  {
    name: "release review",
    markers: [
      "ok release review packet ready",
      "ok release decision inputs documented",
      "ok release execution completed"
    ]
  },
  {
    name: "release candidate readiness",
    markers: [
      "ok release candidate readiness ready",
      "ok local package verification ready",
      "ok release execution completed"
    ]
  },
  {
    name: "release artifact manifest",
    markers: [
      "ok release artifact manifest ready",
      "ok release artifact package identity @source-wire/contracts@0.1.0",
      "ok release artifact integrity recorded",
      "ok release artifact publication recorded",
      "ok published npm artifact metadata recorded"
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
      "ok license decision captured",
      "ok license implementation complete"
    ]
  },
  {
    name: "license approval request",
    markers: [
      "ok license approval request ready",
      "ok owner license approval captured",
      "ok license implementation complete"
    ]
  },
  {
    name: "license implementation plan",
    markers: [
      "ok license implementation plan ready",
      "ok license decision paths mapped",
      "ok license implementation complete"
    ]
  },
  {
    name: "owner license approval preflight",
    markers: [
      "ok owner license approval preflight ready",
      "ok owner approval package complete",
      "ok owner license approval captured"
    ]
  },
  {
    name: "owner decision workflow",
    markers: [
      "ok owner decision workflow ready",
      "ok owner decision options available",
      "ok owner license decision captured"
    ]
  },
  {
    name: "owner decision intake",
    markers: [
      "ok owner decision intake ready",
      "ok owner decision options available",
      "ok owner decision captured"
    ]
  },
  {
    name: "legal review packet",
    markers: [
      "ok legal review packet ready",
      "ok owner license approval recorded"
    ]
  },
  {
    name: "hosted runtime PRD preparation",
    markers: [
      "ok hosted runtime PRD preparation ready",
      "ok hosted runtime PRD evidence map ready",
      "blocked hosted runtime PRD approval missing"
    ]
  },
  {
    name: "hosted runtime PRD execution packet",
    markers: [
      "ok hosted runtime PRD execution packet ready",
      "ok hosted runtime PRD execution scope documented",
      "blocked hosted runtime PRD approval missing"
    ]
  },
  {
    name: "contribution terms PRD preparation",
    markers: [
      "ok contribution terms PRD preparation ready",
      "ok contribution terms evidence map ready",
      "blocked contribution terms PRD approval missing"
    ]
  },
  {
    name: "contribution terms PRD execution packet",
    markers: [
      "ok contribution terms PRD execution packet ready",
      "ok contribution terms PRD execution scope documented",
      "blocked contribution terms PRD approval missing"
    ]
  },
  {
    name: "owner approval packet",
    markers: [
      "ok owner approval packet ready",
      "ok exact owner approval texts available",
      "blocked approval recording is manual owner action"
    ]
  },
  {
    name: "owner launch checklist",
    markers: [
      "ok owner launch checklist ready",
      "blocked launch channels missing"
    ]
  },
  {
    name: "world-share boundary",
    markers: [
      "ok world share open source ready",
      "blocked production launch channels"
    ]
  },
  {
    name: "world-share packet",
    markers: [
      "ok world share packet ready",
      "ok public share copy current",
      "blocked production launch channels"
    ]
  },
  {
    name: "first visitor share audit",
    markers: [
      "ok first visitor share audit ready",
      "ok apache 2 reuse ready",
      "blocked production launch channels"
    ]
  },
  {
    name: "readme entrypoint smoke",
    markers: [
      "ok readme entrypoint smoke ready",
      "ok readme first reviewer path visible",
      "blocked unsafe readme launch claims"
    ]
  },
  {
    name: "public intake boundary",
    markers: [
      "ok public intake boundary ready",
      "ok apache 2 intake wording current",
      "blocked code contribution acceptance"
    ]
  },
  {
    name: "reviewer intake smoke",
    markers: [
      "ok reviewer intake smoke ready",
      "ok reviewer issue templates structured",
      "blocked unsafe reviewer data intake"
    ]
  },
  {
    name: "reviewer first-pass smoke",
    markers: ["ok reviewer first-pass smoke"]
  },
  {
    name: "repository metadata boundary",
    markers: [
      "ok repository metadata boundary ready",
      "ok github about wording current",
      "blocked hosted runtime not approved"
    ]
  },
  {
    name: "branch governance implementation plan",
    markers: [
      "ok branch governance implementation plan ready",
      "ok branch governance recommended path documented",
      "blocked branch governance implementation approval missing"
    ]
  },
  {
    name: "branch governance execution packet",
    markers: [
      "ok branch governance execution packet ready",
      "ok minimal branch protection settings documented",
      "blocked branch governance implementation approval missing"
    ]
  },
  {
    name: "historical license boundary",
    markers: [
      "ok historical license boundary ready",
      "ok unlicensed recommendation superseded",
      "blocked license history launch approval"
    ]
  },
  {
    name: "pull request boundary",
    markers: [
      "ok pull request boundary ready",
      "ok code contribution pr blocked",
      "blocked private data in pull requests"
    ]
  },
  {
    name: "launch decision status",
    markers: [
      "ok launch decision status ready",
      "ok apache 2 license implemented",
      "ok source repo sharing ready",
      "ok npm package published @source-wire/contracts@0.1.0",
      "ok github release published v0.1.0",
      "blocked hosted runtime not approved",
      "blocked contributions not accepted"
    ]
  },
  {
    name: "package dry run",
    markers: [
      "ok package dry-run @source-wire/contracts@0.1.0",
      "ok package file count"
    ]
  },
  {
    name: "package content smoke",
    markers: [
      "ok package content smoke @source-wire/contracts@0.1.0",
      "ok installed required paths",
      "ok installed runtime readiness summary",
      "ok installed runtime readiness summary content",
      "ok installed package docs links",
      "ok installed package docs anchors"
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
      "ok runtime boundary installed smoke @source-wire/contracts@0.1.0",
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
      "ok docs anchors",
      "ok command docs setup",
      "ok readiness command docs match package scripts"
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
