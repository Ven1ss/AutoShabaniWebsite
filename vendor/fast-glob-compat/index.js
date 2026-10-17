"use strict";

/**
 * Minimal subset of fast-glob used by Tailwind CSS and eslint-config-next.
 * Implemented with `glob` so the tree does not pull in braces/micromatch.
 */

const fs = require("fs");
const globMod = require("glob");
const nodeGlobSync = globMod.globSync || globMod.sync;

function isNegativePattern(pattern) {
  return typeof pattern === "string" && pattern.startsWith("!") && pattern[1] !== "(";
}

function globSync(patterns, options = {}) {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  const cwd = options.cwd || process.cwd();
  const out = new Set();
  const ignore = [
    ...(Array.isArray(options.ignore) ? options.ignore : options.ignore ? [options.ignore] : []),
  ];

  const positive = [];
  for (const pattern of list) {
    if (typeof pattern !== "string" || !pattern) continue;
    if (isNegativePattern(pattern)) {
      ignore.push(pattern.slice(1));
      continue;
    }
    positive.push(pattern);
  }

  for (const pattern of positive) {
    const matches = nodeGlobSync(pattern.replace(/\\/g, "/"), {
      cwd,
      absolute: options.absolute !== false,
      nodir: options.onlyFiles === true,
      dot: Boolean(options.dot),
      ignore,
    });
    for (const match of matches) {
      if (options.onlyDirectories) {
        try {
          if (!fs.statSync(match).isDirectory()) continue;
        } catch {
          continue;
        }
      }
      out.add(match);
    }
  }

  return [...out];
}

function sync(patterns, options) {
  return globSync(patterns, options);
}

async function glob(patterns, options) {
  return globSync(patterns, options);
}

/**
 * Tailwind content.js expects tasks with `.positive` / `.negative` arrays.
 * Negative patterns are returned as positive paths (bang stripped), matching
 * real fast-glob generateTasks behavior.
 */
function generateTasks(source, _options) {
  const patterns = [].concat(source).filter((p) => typeof p === "string" && p.length > 0);
  const positive = patterns.filter((p) => !isNegativePattern(p));
  const negative = patterns
    .filter(isNegativePattern)
    .map((p) => p.slice(1));
  return [
    {
      dynamic: true,
      positive,
      negative,
      base: ".",
      patterns: [...positive, ...negative.map((p) => "!" + p)],
    },
  ];
}

/** Escape glob special chars in a path segment (Tailwind uses this on bases). */
function escapePath(source) {
  const input = Array.isArray(source) ? source[0] : source;
  if (typeof input !== "string") return "";
  return input.replace(/([*?[\]{}()!+@])/g, "\\$1");
}

module.exports = glob;
module.exports.glob = glob;
module.exports.sync = sync;
module.exports.globSync = globSync;
module.exports.generateTasks = generateTasks;
module.exports.escapePath = escapePath;
module.exports.default = module.exports;
