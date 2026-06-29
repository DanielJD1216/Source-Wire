import { validateSourceWireFile } from "./validation.js";

const fixtureFiles = {
  projectContextPack: "examples/fixtures/project-context-pack/project-context.json",
  secondBrain: "examples/fixtures/second-brain/use-2nd-brain-example.json",
  chatExport: "examples/fixtures/chat-export/agent-session.jsonl"
};

const results = [
  await validateSourceWireFile("project-context-pack", fixtureFiles.projectContextPack),
  await validateSourceWireFile("second-brain-v1", fixtureFiles.secondBrain),
  await validateSourceWireFile("chat-export-message", fixtureFiles.chatExport)
];

const failed = results.filter((result) => !result.ok);

for (const result of results) {
  if (result.ok) {
    console.log(`ok ${result.file}`);
    continue;
  }

  console.error(`failed ${result.file}`);
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
}

if (failed.length > 0) {
  process.exitCode = 1;
}
