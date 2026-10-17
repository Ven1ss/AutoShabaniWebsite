"use strict";

/**
 * Minimal micromatch subset for Tailwind CSS content matching.
 * Uses picomatch only — avoids the vulnerable braces dependency.
 */

const picomatch = require("picomatch");

function toArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function micromatch(list, patterns, options) {
  const isMatch = picomatch(toArray(patterns), options);
  return toArray(list).filter((item) => isMatch(item));
}

micromatch.matcher = function matcher(patterns, options) {
  return picomatch(toArray(patterns), options);
};

micromatch.isMatch = function isMatch(str, patterns, options) {
  return picomatch(toArray(patterns), options)(str);
};

micromatch.not = function not(list, patterns, options) {
  const isMatch = picomatch(toArray(patterns), options);
  return toArray(list).filter((item) => !isMatch(item));
};

micromatch.match = micromatch;
micromatch.any = micromatch.isMatch;
micromatch.contains = micromatch.isMatch;
micromatch.makeRe = function makeRe(patterns, options) {
  return picomatch.makeRe(toArray(patterns)[0], options);
};

module.exports = micromatch;
module.exports.default = micromatch;
