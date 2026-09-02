#!/usr/bin/env node
// Install or remove Lucy's two hooks in $HOME/.claude/settings.json for the
// dev machine, where Lucy runs from symlinks rather than as an installed
// plugin. Adapted from Leonxlnx/unlazy scripts/install-hooks.mjs at commit
// 473d4b80421c36d733042434cd4b938f81a19ef1 (MIT; notice in
// scripts/install-dev-hooks.LICENSE). Zero dependencies. Node 16+.
//
// Usage: node scripts/install-dev-hooks.mjs [--uninstall]
//
// SessionStart (startup|clear|compact): bash <repo>/hooks/session-start
// Stop: <this node> $HOME/.claude/skills/unlazy/scripts/stop-hook.mjs
// Both commands end with " --lucy-hook-v1"; that marker is how Lucy's groups
// are recognised on later runs and on uninstall. Other hooks are preserved.

import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const MARKER = "--lucy-hook-v1";
const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOME = process.env.HOME || homedir();
const SETTINGS = join(HOME, ".claude", "settings.json");

const args = process.argv.slice(2);
const uninstall = args.includes("--uninstall");
const unknown = args.filter((a) => a !== "--uninstall");
if (unknown.length > 0) {
  console.error("install-dev-hooks: unknown option " + unknown.join(" "));
  process.exit(2);
}

const quote = (p) => JSON.stringify(p);
const entries = {
  SessionStart: {
    matcher: "startup|clear|compact",
    hooks: [{ type: "command", command: "bash " + quote(join(REPO, "hooks", "session-start")) + " " + MARKER }],
  },
  Stop: {
    hooks: [{
      type: "command",
      command: quote(process.execPath) + " " + quote(join(HOME, ".claude", "skills", "unlazy", "scripts", "stop-hook.mjs")) + " " + MARKER,
    }],
  },
};

let settings = {};
if (existsSync(SETTINGS)) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(SETTINGS, "utf8"));
  } catch {
    console.error("install-dev-hooks: " + SETTINGS + " is not valid JSON; refusing to touch it");
    process.exit(2);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.error("install-dev-hooks: settings must be a JSON object; refusing");
    process.exit(2);
  }
  settings = parsed;
  copyFileSync(SETTINGS, SETTINGS + ".lucy.bak");
}

if (settings.hooks !== undefined &&
    (settings.hooks === null || typeof settings.hooks !== "object" || Array.isArray(settings.hooks))) {
  console.error("install-dev-hooks: settings.hooks has an unsupported shape; refusing");
  process.exit(2);
}
const hooks = settings.hooks || {};

const isLucyGroup = (group) => group && Array.isArray(group.hooks) &&
  group.hooks.some((h) => h && typeof h.command === "string" && h.command.endsWith(" " + MARKER));

for (const event of Object.keys(entries)) {
  const existing = Array.isArray(hooks[event]) ? hooks[event] : [];
  const kept = existing.filter((group) => !isLucyGroup(group));
  if (!uninstall) kept.push(entries[event]);
  if (kept.length > 0) hooks[event] = kept; else delete hooks[event];
}
if (Object.keys(hooks).length > 0) settings.hooks = hooks; else delete settings.hooks;

mkdirSync(dirname(SETTINGS), { recursive: true });
const tmp = SETTINGS + ".lucy.tmp";
writeFileSync(tmp, JSON.stringify(settings, null, 2) + "\n");
renameSync(tmp, SETTINGS);
console.log((uninstall ? "removed" : "installed") + " Lucy hooks in " + SETTINGS);
