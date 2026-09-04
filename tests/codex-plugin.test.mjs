import assert from "node:assert/strict";
import {
  copyFileSync,
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const flowNames = [
  "brainstorm", "plan", "execute", "finish", "promote", "handoff",
  "wizard", "idea", "explore", "teach", "lucy", "using-lucy",
];

function assertPortable(body, label) {
  assert.doesNotMatch(body, /Call the Skill tool/i,
    `${label} must use host-neutral skill invocation wording`);
  assert.doesNotMatch(body, /claude --bg|claude agents|Claude Code Stop hook/i,
    `${label} must not require a Claude-only workflow`);

  for (const flow of flowNames) {
    assert.doesNotMatch(body, new RegExp(`/${flow}\\b`),
      `${label} must not prescribe /${flow} syntax`);
  }
  assert.doesNotMatch(body, /\/(?:clear|compact)\b/,
    `${label} must not prescribe a provider-specific context command`);
}

function assertHookContract(value, label) {
  const sessionStart = value.hooks.SessionStart?.[0];
  assert.ok(sessionStart, `${label} must define SessionStart`);
  for (const source of ["startup", "resume", "clear", "compact"]) {
    assert.match(sessionStart.matcher, new RegExp(`(?:^|\\|)${source}(?:\\||$)`),
      `${label} SessionStart must cover ${source}`);
  }

  const sessionHandler = sessionStart.hooks?.find((hook) => hook.type === "command");
  assert.ok(sessionHandler, `${label} SessionStart must define a command handler`);
  assert.equal(sessionHandler.async, false,
    `${label} SessionStart command must remain synchronous`);
  assert.match(sessionHandler.command, /\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/session-start/,
    `${label} SessionStart must use the plugin-root hook command`);

  const stop = value.hooks.Stop?.[0];
  const stopHandler = stop?.hooks?.find((hook) => hook.type === "command");
  assert.ok(stopHandler, `${label} must define a Stop command handler`);
  assert.match(stopHandler.command,
    /\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/unlazy\/scripts\/stop-hook\.mjs/,
    `${label} Stop must use the plugin-root unlazy hook command`);
}

const plugin = readJson(resolve(root, ".codex-plugin/plugin.json"));
const marketplace = readJson(resolve(root, ".agents/plugins/marketplace.json"));
const hooks = readJson(resolve(root, "hooks/hooks.json"));

assert.equal(plugin.name, "lucy");
assert.equal(plugin.version, "0.2.0");
assert.equal(plugin.skills, "./skills/");
assert.equal(marketplace.name, "lucy-codex");
assert.deepEqual(marketplace.plugins, [{
  name: "lucy",
  source: "./",
  description: "Adnan's personal plugin system for Codex.",
}]);

for (const skill of readdirSync(resolve(root, "skills"))) {
  const skillPath = resolve(root, "skills", skill);
  if (statSync(skillPath).isDirectory()) {
    const policyPath = resolve(skillPath, "agents/openai.yaml");
    assert.ok(
      statSync(policyPath).isFile(),
      `${skill} must include agents/openai.yaml`,
    );

    const body = readFileSync(resolve(skillPath, "SKILL.md"), "utf8");
    const policy = readFileSync(policyPath, "utf8");
    const userInvoked = /^disable-model-invocation:\s*true\s*$/m.test(body);
    const implicitDisabled = /^\s*allow_implicit_invocation:\s*false\s*$/m.test(policy);

    assert.equal(implicitDisabled, userInvoked,
      `${skill} must keep agents/openai.yaml in sync with disable-model-invocation`);
    assertPortable(body, skill);
  }
}

assertHookContract(hooks, "hooks/hooks.json");

const installHome = mkdtempSync(join(tmpdir(), "lucy-codex-hook-test-"));
try {
  const installer = spawnSync(process.execPath, [
    resolve(root, "scripts/install-dev-hooks.mjs"),
  ], {
    encoding: "utf8",
    env: { ...process.env, HOME: installHome },
  });
  assert.equal(installer.status, 0, installer.stderr || installer.stdout);

  const settings = readJson(join(installHome, ".claude/settings.json"));
  assert.match(settings.hooks.SessionStart[0].matcher, /(?:^|\|)resume(?:\||$)/,
    "development hook installer must cover resumed sessions");
} finally {
  rmSync(installHome, { recursive: true, force: true });
}

const policyFixture = mkdtempSync(join(tmpdir(), "lucy-codex-policy-test-"));
try {
  for (const path of [".agents", ".codex-plugin", "hooks", "skills"]) {
    cpSync(resolve(root, path), resolve(policyFixture, path), { recursive: true });
  }
  mkdirSync(resolve(policyFixture, "scripts"), { recursive: true });
  copyFileSync(
    resolve(root, "scripts/validate-codex-plugin.mjs"),
    resolve(policyFixture, "scripts/validate-codex-plugin.mjs"),
  );

  const alteredPolicy = resolve(policyFixture, "skills/brainstorm/agents/openai.yaml");
  writeFileSync(
    alteredPolicy,
    readFileSync(alteredPolicy, "utf8").replace(
      "allow_implicit_invocation: false",
      "allow_implicit_invocation: true",
    ),
  );

  const invalidPolicy = spawnSync(process.execPath, [
    resolve(policyFixture, "scripts/validate-codex-plugin.mjs"),
  ], { encoding: "utf8" });
  assert.notEqual(invalidPolicy.status, 0,
    "validator must reject an OpenAI policy that disagrees with skill frontmatter");
} finally {
  rmSync(policyFixture, { recursive: true, force: true });
}

for (const relativePath of [
  "skills/lucy/PHASE-BOUNDARIES.md",
  "skills/brainstorm/spec-template.md",
  "skills/unlazy/SECURITY.md",
]) {
  assertPortable(readFileSync(resolve(root, relativePath), "utf8"), relativePath);
}

const portabilityFixture = mkdtempSync(join(tmpdir(), "lucy-codex-portability-test-"));
try {
  for (const path of [".agents", ".codex-plugin", "hooks", "skills"]) {
    cpSync(resolve(root, path), resolve(portabilityFixture, path), { recursive: true });
  }
  mkdirSync(resolve(portabilityFixture, "scripts"), { recursive: true });
  copyFileSync(
    resolve(root, "scripts/validate-codex-plugin.mjs"),
    resolve(portabilityFixture, "scripts/validate-codex-plugin.mjs"),
  );

  const phaseBoundaries = resolve(portabilityFixture, "skills/lucy/PHASE-BOUNDARIES.md");
  writeFileSync(
    phaseBoundaries,
    readFileSync(phaseBoundaries, "utf8") + "\nUse /clear before the next phase.\n",
  );

  const invalidPortability = spawnSync(process.execPath, [
    resolve(portabilityFixture, "scripts/validate-codex-plugin.mjs"),
  ], { encoding: "utf8" });
  assert.notEqual(invalidPortability.status, 0,
    "validator must reject provider-specific commands in live support documents");
} finally {
  rmSync(portabilityFixture, { recursive: true, force: true });
}

const hookFixture = mkdtempSync(join(tmpdir(), "lucy-codex-hook-contract-test-"));
try {
  for (const path of [".agents", ".codex-plugin", "hooks", "skills"]) {
    cpSync(resolve(root, path), resolve(hookFixture, path), { recursive: true });
  }
  mkdirSync(resolve(hookFixture, "scripts"), { recursive: true });
  copyFileSync(
    resolve(root, "scripts/validate-codex-plugin.mjs"),
    resolve(hookFixture, "scripts/validate-codex-plugin.mjs"),
  );

  const invalidHooks = readJson(resolve(hookFixture, "hooks/hooks.json"));
  invalidHooks.hooks.SessionStart[0].hooks = [];
  writeFileSync(resolve(hookFixture, "hooks/hooks.json"), JSON.stringify(invalidHooks, null, 2));

  const invalidHookContract = spawnSync(process.execPath, [
    resolve(hookFixture, "scripts/validate-codex-plugin.mjs"),
  ], { encoding: "utf8" });
  assert.notEqual(invalidHookContract.status, 0,
    "validator must reject a SessionStart matcher without its handler");
} finally {
  rmSync(hookFixture, { recursive: true, force: true });
}

const execute = readFileSync(resolve(root, "skills/execute/SKILL.md"), "utf8");
assert.match(execute, /fork_turns:\s*"none"/,
  "execute must tell Codex to create fresh agents without inherited history");

const reviewChanges = readFileSync(resolve(root, "skills/review-changes/SKILL.md"), "utf8");
assert.doesNotMatch(reviewChanges, /general-purpose/,
  "review-changes must not prescribe a Claude-only agent type");

assert.match(readFileSync(resolve(root, "README.md"), "utf8"), /\$lucy:brainstorm/,
  "README must show a Codex-qualified Lucy skill selector");

const validator = spawnSync(process.execPath, [
  resolve(root, "scripts/validate-codex-plugin.mjs"),
], { encoding: "utf8" });

assert.equal(validator.status, 0, validator.stderr || validator.stdout);
