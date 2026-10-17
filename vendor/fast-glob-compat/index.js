"use strict";

/**
 * Minimal subset of fast-glob used by @next/eslint-plugin-next.
 * Implemented with `glob` so the tree does not pull in braces/micromatch.
 */

const fs = require("fs");
const globMod = require("glob");
const nodeGlobSync = globMod.globSync || globMod.sync;

function globSync(patterns, options = {}) {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  const cwd = options.cwd || process.cwd();
  const out = new Set();

  for (const pattern of list) {
    if (typeof pattern !== "string" || !pattern) continue;
    const matches = nodeGlobSync(pattern.replace(/\\/g, "/"), {
      cwd,
      absolute: options.absolute !== false,
      nodir: options.onlyFiles === true,
      dot: Boolean(options.dot),
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

module.exports = glob;
module.exports.glob = glob;
module.exports.sync = sync;
module.exports.globSync = globSync;
module.exports.default = module.exports;
