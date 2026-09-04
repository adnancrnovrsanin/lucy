import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const flows = [
  "brainstorm", "plan", "execute", "finish", "promote", "handoff",
  "wizard", "idea", "explore", "teach", "lucy", "using-lucy",
];

function fail(message) {
  throw new Error(message);
}

function readJson(relativePath) {
  const path = resolve(root, relativePath);

  if (!existsSync(path)) {
    fail(`Missing ${relativePath}`);
  }

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label} must be ${JSON.stringify(expected)}`);
  }
}

function validatePlugin(plugin) {
  expectEqual(plugin.name, "lucy", ".codex-plugin/plugin.json name");
  expectEqual(plugin.version, "0.2.0", ".codex-plugin/plugin.json version");
  expectEqual(plugin.skills, "./skills/", ".codex-plugin/plugin.json skills");
}

function validateMarketplace(marketplace) {
  expectEqual(marketplace.name, "lucy-codex", ".agents/plugins/marketplace.json name");

  const expectedPlugin = {
    name: "lucy",
    source: "./",
    description: "Adnan's personal plugin system for Codex.",
  };

  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length !== 1) {
    fail(".agents/plugins/marketplace.json must contain exactly one plugin");
  }

  for (const [key, value] of Object.entries(expectedPlugin)) {
    expectEqual(marketplace.plugins[0][key], value, `marketplace plugin ${key}`);
  }
}

function validatePortability(body, relativePath) {
  if (/Call the Skill tool/i.test(body)) {
    fail(`${relativePath} must use host-neutral skill invocation wording`);
  }
  if (/claude --bg|claude agents|Claude Code Stop hook/i.test(body)) {
    fail(`${relativePath} contains a retired Claude-only instruction`);
  }
  for (const flow of flows) {
    if (new RegExp(`/${flow}\\b`).test(body)) {
      fail(`${relativePath} must not prescribe /${flow} syntax`);
    }
  }
  if (/\/(?:clear|compact)\b/.test(body)) {
    fail(`${relativePath} must not prescribe a provider-specific context command`);
  }
}

function validateSkills() {
  const skillsPath = resolve(root, "skills");

  for (const skill of readdirSync(skillsPath)) {
    const skillPath = resolve(skillsPath, skill);
    if (!statSync(skillPath).isDirectory()) {
      continue;
    }

    const policyPath = resolve(skillPath, "agents/openai.yaml");
    if (!existsSync(policyPath) || !statSync(policyPath).isFile()) {
      fail(`Missing skills/${skill}/agents/openai.yaml`);
    }

    const body = readFileSync(resolve(skillPath, "SKILL.md"), "utf8");
    const policy = readFileSync(policyPath, "utf8");
    const userInvoked = /^disable-model-invocation:\s*true\s*$/m.test(body);
    const implicitDisabled = /^\s*allow_implicit_invocation:\s*false\s*$/m.test(policy);

    if (userInvoked !== implicitDisabled) {
      fail(`skills/${skill} has mismatched disable-model-invocation and OpenAI policy`);
    }
    validatePortability(body, `skills/${skill}/SKILL.md`);
  }
}

function validateSupportDocuments() {
  for (const relativePath of [
    "skills/lucy/PHASE-BOUNDARIES.md",
    "skills/brainstorm/spec-template.md",
    "skills/unlazy/SECURITY.md",
  ]) {
    const path = resolve(root, relativePath);
    if (!existsSync(path)) {
      fail(`Missing ${relativePath}`);
    }
    validatePortability(readFileSync(path, "utf8"), relativePath);
  }
}

function validateExecutionAdapters() {
  const execute = readFileSync(resolve(root, "skills/execute/SKILL.md"), "utf8");
  if (!/fork_turns:\s*"none"/.test(execute)) {
    fail("skills/execute/SKILL.md must specify fork_turns: \"none\" for Codex workers");
  }

  const reviewChanges = readFileSync(resolve(root, "skills/review-changes/SKILL.md"), "utf8");
  if (/general-purpose/.test(reviewChanges)) {
    fail("skills/review-changes/SKILL.md must not prescribe a Claude-only agent type");
  }
}

function validateHooks() {
  const hooks = readJson("hooks/hooks.json");
  const sessionStart = hooks.hooks?.SessionStart?.[0];

  if (!sessionStart) {
    fail("hooks/hooks.json must define SessionStart");
  }
  for (const source of ["startup", "resume", "clear", "compact"]) {
    if (!new RegExp(`(?:^|\\|)${source}(?:\\||$)`).test(sessionStart.matcher || "")) {
      fail(`hooks/hooks.json SessionStart matcher must include ${source}`);
    }
  }

  const sessionHandler = sessionStart.hooks?.find((hook) => hook.type === "command");
  if (!sessionHandler) {
    fail("hooks/hooks.json SessionStart must define a command handler");
  }
  if (sessionHandler.async !== false) {
    fail("hooks/hooks.json SessionStart command must remain synchronous");
  }
  if (!/\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/session-start/.test(sessionHandler.command || "")) {
    fail("hooks/hooks.json SessionStart must use the plugin-root hook command");
  }

  const stop = hooks.hooks?.Stop?.[0];
  const stopHandler = stop?.hooks?.find((hook) => hook.type === "command");
  if (!stopHandler) {
    fail("hooks/hooks.json must define a Stop command handler");
  }
  if (!/\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/unlazy\/scripts\/stop-hook\.mjs/.test(stopHandler.command || "")) {
    fail("hooks/hooks.json Stop must use the plugin-root unlazy hook command");
  }
}

try {
  validatePlugin(readJson(".codex-plugin/plugin.json"));
  validateMarketplace(readJson(".agents/plugins/marketplace.json"));
  validateSkills();
  validateSupportDocuments();
  validateExecutionAdapters();
  validateHooks();
  console.log("Codex plugin package is valid.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
