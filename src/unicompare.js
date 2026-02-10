"use strict";

const shared = require("./shared");

// ─────────────────────────────────────────────────────────────────────
//  INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────

/**
 * Fast type tag — avoids repeated typeof / instanceof chains.
 * Returns: 'null' | 'undefined' | 'array' | 'date' | 'regexp' | 'map' |
 *          'set' | 'object' | 'number' | 'string' | 'boolean' | 'function' |
 *          'bigint' | 'symbol'
 */
const typeOf = (v) => {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (Array.isArray(v)) return "array";
  if (v instanceof Date) return "date";
  if (v instanceof RegExp) return "regexp";
  if (v instanceof Map) return "map";
  if (v instanceof Set) return "set";
  return typeof v;
};

/**
 * Check if a value is a plain object (not Date, RegExp, Map, Set, etc.)
 */
const isPlainObject = (v) =>
  v !== null &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  !(v instanceof Date) &&
  !(v instanceof RegExp) &&
  !(v instanceof Map) &&
  !(v instanceof Set);

// ─────────────────────────────────────────────────────────────────────
//  1. objEqual  —  Deep / Shallow equality (optimised, circular-safe)
// ─────────────────────────────────────────────────────────────────────

/**
 * Compare two values for equality.
 *
 * @param {*} a          — First value
 * @param {*} b          — Second value
 * @param {boolean} deep — true  → recursive deep comparison
 *                         false → shallow (only top-level keys)
 * @returns {boolean}
 */
const objEqual = (a, b, deep, _seen) => {
  // --- Primitive / reference fast path ---
  if (a === b) return true;

  const ta = typeOf(a);
  const tb = typeOf(b);
  if (ta !== tb) return false;

  // --- NaN check ---
  if (ta === "number" && Number.isNaN(a) && Number.isNaN(b)) return true;

  // --- Date ---
  if (ta === "date") return a.getTime() === b.getTime();

  // --- RegExp ---
  if (ta === "regexp") return a.toString() === b.toString();

  // --- Map ---
  if (ta === "map") {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) {
      if (!b.has(k)) return false;
      if (deep && !objEqual(v, b.get(k), true, _seen)) return false;
      if (!deep && v !== b.get(k)) return false;
    }
    return true;
  }

  // --- Set ---
  if (ta === "set") {
    if (a.size !== b.size) return false;
    for (const v of a) {
      if (!b.has(v)) return false;
    }
    return true;
  }

  // --- Array ---
  if (ta === "array") {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (deep) {
        if (!objEqual(a[i], b[i], true, _seen)) return false;
      } else {
        if (a[i] !== b[i]) return false;
      }
    }
    return true;
  }

  // --- Plain object ---
  if (ta === "object") {
    // Circular reference protection
    if (!_seen) _seen = new WeakSet();
    if (_seen.has(a)) return true; // already visited → assume equal
    _seen.add(a);

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
      const k = keysA[i];
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (deep) {
        if (!objEqual(a[k], b[k], true, _seen)) return false;
      } else {
        const tav = typeOf(a[k]);
        if (tav === "object" || tav === "array") continue;
        if (a[k] !== b[k]) return false;
      }
    }
    return true;
  }

  // --- Fallback (functions, symbols, bigints) ---
  return false;
};

exports.objEqual = function (obj1, obj2, deep) {
  if (deep !== true && deep !== false && deep !== undefined) {
    throw new TypeError("[unicompare] deep must be a boolean");
  }
  return objEqual(obj1, obj2, deep !== false);
};

// ─────────────────────────────────────────────────────────────────────
//  2. some  —  Search a value recursively inside any structure
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns true if `needle` exists anywhere deep inside `haystack`.
 * Supports nested objects, arrays, Maps, and Sets.
 *
 * @param {*} haystack — Root structure to search
 * @param {*} needle   — Value to look for (compared with deep equality)
 * @returns {boolean}
 */
const some = (haystack, needle, _seen) => {
  if (objEqual(haystack, needle, true)) return true;

  const t = typeOf(haystack);

  // Circular reference protection
  if (t === "object" || t === "array" || t === "map" || t === "set") {
    if (!_seen) _seen = new WeakSet();
    if (typeof haystack === "object" && haystack !== null) {
      if (_seen.has(haystack)) return false;
      _seen.add(haystack);
    }
  }

  if (t === "array") {
    for (let i = 0; i < haystack.length; i++) {
      if (some(haystack[i], needle, _seen)) return true;
    }
    return false;
  }

  if (t === "object") {
    const vals = Object.values(haystack);
    for (let i = 0; i < vals.length; i++) {
      if (some(vals[i], needle, _seen)) return true;
    }
    return false;
  }

  if (t === "map") {
    for (const v of haystack.values()) {
      if (some(v, needle, _seen)) return true;
    }
    return false;
  }

  if (t === "set") {
    for (const v of haystack) {
      if (some(v, needle, _seen)) return true;
    }
    return false;
  }

  return false;
};

exports.some = function (rootObj, v) {
  if (rootObj === undefined || rootObj === null) {
    throw new Error("[unicompare] rootObj is not defined");
  }
  return some(rootObj, v);
};

// ─────────────────────────────────────────────────────────────────────
//  3. diff  —  Detailed structural diff between two objects
// ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} DiffEntry
 * @property {'added'|'removed'|'changed'|'type_changed'} type
 * @property {string}  path       — Dot-notation path, e.g. "cars.car1"
 * @property {*}       [oldValue] — Previous value (for changed / removed)
 * @property {*}       [newValue] — New value (for changed / added)
 */

/**
 * Compute a list of differences between two objects.
 *
 * @param {Object} obj1 — Source object
 * @param {Object} obj2 — Target object
 * @returns {DiffEntry[]}
 */
const diff = (obj1, obj2, prefix, result, _seen) => {
  if (!prefix) prefix = "";
  if (!result) result = [];
  if (!_seen) _seen = new WeakSet();

  if (typeof obj1 === "object" && obj1 !== null) {
    if (_seen.has(obj1)) return result;
    _seen.add(obj1);
  }

  const keys1 = Object.keys(obj1 || {});
  const keys2 = Object.keys(obj2 || {});
  const allKeys = new Set([...keys1, ...keys2]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const inA = Object.prototype.hasOwnProperty.call(obj1 || {}, key);
    const inB = Object.prototype.hasOwnProperty.call(obj2 || {}, key);

    if (inA && !inB) {
      result.push({ type: "removed", path, oldValue: obj1[key] });
      continue;
    }

    if (!inA && inB) {
      result.push({ type: "added", path, newValue: obj2[key] });
      continue;
    }

    const va = obj1[key];
    const vb = obj2[key];

    if (typeOf(va) !== typeOf(vb)) {
      result.push({ type: "type_changed", path, oldValue: va, newValue: vb });
      continue;
    }

    if (isPlainObject(va) && isPlainObject(vb)) {
      diff(va, vb, path, result, _seen);
      continue;
    }

    if (!objEqual(va, vb, true)) {
      result.push({ type: "changed", path, oldValue: va, newValue: vb });
    }
  }

  return result;
};

exports.diff = function (obj1, obj2) {
  if (obj1 === null || obj1 === undefined)
    throw new Error("[unicompare] obj1 is not defined");
  if (obj2 === null || obj2 === undefined)
    throw new Error("[unicompare] obj2 is not defined");
  return diff(obj1, obj2);
};

// ─────────────────────────────────────────────────────────────────────
//  4. deepMerge  —  Recursive merge of N objects (immutable)
// ─────────────────────────────────────────────────────────────────────

/**
 * Deep-merge multiple source objects into a new object.
 * Arrays are replaced (not concatenated) by default.
 * Later sources win on conflicts.
 *
 * @param  {...Object} sources
 * @returns {Object}
 */
exports.deepMerge = function (...sources) {
  const result = {};
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const key of Object.keys(src)) {
      if (isPlainObject(src[key]) && isPlainObject(result[key])) {
        result[key] = exports.deepMerge(result[key], src[key]);
      } else {
        result[key] = deepClone(src[key]);
      }
    }
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────
//  5. deepClone  —  Fast structural clone (circular-safe)
// ─────────────────────────────────────────────────────────────────────

/**
 * Create a deep clone of any value.
 * Handles plain objects, arrays, Date, RegExp, Map, Set.
 * Circular references are preserved without infinite loops.
 *
 * @param {*} value
 * @returns {*}
 */
const deepClone = (value, _map) => {
  if (value === null || typeof value !== "object") return value;
  if (!_map) _map = new Map();
  if (_map.has(value)) return _map.get(value);

  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);

  if (value instanceof Map) {
    const m = new Map();
    _map.set(value, m);
    for (const [k, v] of value) m.set(deepClone(k, _map), deepClone(v, _map));
    return m;
  }

  if (value instanceof Set) {
    const s = new Set();
    _map.set(value, s);
    for (const v of value) s.add(deepClone(v, _map));
    return s;
  }

  if (Array.isArray(value)) {
    const arr = [];
    _map.set(value, arr);
    for (let i = 0; i < value.length; i++) arr[i] = deepClone(value[i], _map);
    return arr;
  }

  // Plain object
  const obj = Object.create(Object.getPrototypeOf(value));
  _map.set(value, obj);
  for (const key of Object.keys(value)) {
    obj[key] = deepClone(value[key], _map);
  }
  return obj;
};

exports.deepClone = function (value) {
  return deepClone(value);
};

// ─────────────────────────────────────────────────────────────────────
//  6. structuralEqual  —  Compare shape (keys only), ignore values
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns true if two objects have the exact same nested key structure.
 * Values are ignored — only keys and nesting depth matter.
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
const structuralEqual = (a, b, _seen) => {
  const ta = typeOf(a);
  const tb = typeOf(b);
  // Both must be objects to recurse; if either is a leaf, shape matches
  // (structuralEqual only cares about keys, not value types)
  if (ta !== "object" && tb !== "object") return true;
  if (ta !== "object" || tb !== "object") return false;

  if (!_seen) _seen = new WeakSet();
  if (_seen.has(a)) return true;
  _seen.add(a);

  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  if (ka.length !== kb.length) return false;
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i]) return false;
    if (!structuralEqual(a[ka[i]], b[kb[i]], _seen)) return false;
  }
  return true;
};

exports.structuralEqual = function (obj1, obj2) {
  return structuralEqual(obj1, obj2);
};

// ─────────────────────────────────────────────────────────────────────
//  7. pick / omit  —  Utility selectors
// ─────────────────────────────────────────────────────────────────────

/**
 * Return a new object with only the listed keys.
 * Supports dot-notation for nested picks: pick(obj, ['a.b.c'])
 *
 * @param {Object} obj
 * @param {string[]} keys
 * @returns {Object}
 */
exports.pick = function (obj, keys) {
  if (!obj || typeof obj !== "object")
    throw new TypeError("[unicompare] obj must be an object");
  if (!Array.isArray(keys))
    throw new TypeError("[unicompare] keys must be an array");

  const result = {};
  for (const key of keys) {
    const parts = key.split(".");
    let src = obj;
    let dst = result;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (i === parts.length - 1) {
        if (src && Object.prototype.hasOwnProperty.call(src, p)) {
          dst[p] = deepClone(src[p]);
        }
      } else {
        if (src && Object.prototype.hasOwnProperty.call(src, p)) {
          if (!dst[p]) dst[p] = {};
          dst = dst[p];
          src = src[p];
        } else {
          break;
        }
      }
    }
  }
  return result;
};

/**
 * Return a new object WITHOUT the listed keys (opposite of pick).
 *
 * @param {Object} obj
 * @param {string[]} keys
 * @returns {Object}
 */
exports.omit = function (obj, keys) {
  if (!obj || typeof obj !== "object")
    throw new TypeError("[unicompare] obj must be an object");
  if (!Array.isArray(keys))
    throw new TypeError("[unicompare] keys must be an array");

  const topLevelExcludes = new Set(keys.map((k) => k.split(".")[0]));
  const result = {};
  for (const key of Object.keys(obj)) {
    if (topLevelExcludes.has(key)) {
      // Check if this is a nested omit
      const nestedKeys = keys
        .filter((k) => k.startsWith(key + "."))
        .map((k) => k.slice(key.length + 1));
      if (nestedKeys.length > 0 && isPlainObject(obj[key])) {
        result[key] = exports.omit(obj[key], nestedKeys);
      }
      // If only top-level key listed, just skip it
      if (keys.includes(key)) continue;
      if (nestedKeys.length > 0) continue; // already handled
      result[key] = deepClone(obj[key]);
    } else {
      result[key] = deepClone(obj[key]);
    }
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────
//  8. Array utilities  —  intersect / union / difference / unique
// ─────────────────────────────────────────────────────────────────────

/**
 * Return elements present in BOTH arrays (deep comparison).
 * @param {Array} a
 * @param {Array} b
 * @returns {Array}
 */
exports.intersect = function (a, b) {
  if (!Array.isArray(a) || !Array.isArray(b))
    throw new TypeError("[unicompare] both arguments must be arrays");
  return a.filter((va) => b.some((vb) => objEqual(va, vb, true)));
};

/**
 * Return the union of two arrays, removing deep-duplicates.
 * @param {Array} a
 * @param {Array} b
 * @returns {Array}
 */
exports.union = function (a, b) {
  if (!Array.isArray(a) || !Array.isArray(b))
    throw new TypeError("[unicompare] both arguments must be arrays");
  const result = [...a];
  for (const vb of b) {
    if (!result.some((va) => objEqual(va, vb, true))) {
      result.push(vb);
    }
  }
  return result;
};

/**
 * Return elements in `a` that are NOT in `b` (deep comparison).
 * @param {Array} a
 * @param {Array} b
 * @returns {Array}
 */
exports.difference = function (a, b) {
  if (!Array.isArray(a) || !Array.isArray(b))
    throw new TypeError("[unicompare] both arguments must be arrays");
  return a.filter((va) => !b.some((vb) => objEqual(va, vb, true)));
};

/**
 * Remove deep-duplicate values from an array.
 * @param {Array} arr
 * @returns {Array}
 */
exports.unique = function (arr) {
  if (!Array.isArray(arr))
    throw new TypeError("[unicompare] argument must be an array");
  const result = [];
  for (const item of arr) {
    if (!result.some((r) => objEqual(r, item, true))) {
      result.push(item);
    }
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────
//  9. flatten / unflatten  —  Dot-notation ↔ nested
// ─────────────────────────────────────────────────────────────────────

/**
 * Flatten a nested object into dot-notation keys.
 *   { a: { b: 1 } }  →  { 'a.b': 1 }
 *
 * @param {Object} obj
 * @param {string} [separator='.']
 * @returns {Object}
 */
exports.flatten = function (obj, separator) {
  if (!separator) separator = ".";
  const result = {};
  const _flatten = (current, prefix) => {
    for (const key of Object.keys(current)) {
      const path = prefix ? `${prefix}${separator}${key}` : key;
      if (isPlainObject(current[key])) {
        _flatten(current[key], path);
      } else {
        result[path] = current[key];
      }
    }
  };
  _flatten(obj, "");
  return result;
};

/**
 * Unflatten a dot-notation object back into nested structure.
 *   { 'a.b': 1 }  →  { a: { b: 1 } }
 *
 * @param {Object} obj
 * @param {string} [separator='.']
 * @returns {Object}
 */
exports.unflatten = function (obj, separator) {
  if (!separator) separator = ".";
  const result = {};
  for (const key of Object.keys(obj)) {
    const parts = key.split(separator);
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (i === parts.length - 1) {
        current[p] = obj[key];
      } else {
        if (!current[p] || typeof current[p] !== "object") current[p] = {};
        current = current[p];
      }
    }
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────
//  10. get / set / has  —  Safe deep property access
// ─────────────────────────────────────────────────────────────────────

/**
 * Safely get a deeply nested value by dot-notation path.
 * @param {Object} obj
 * @param {string} path       — e.g. 'a.b.c' or 'arr.0.name'
 * @param {*}      [fallback] — returned if path doesn't exist
 * @returns {*}
 */
exports.get = function (obj, path, fallback) {
  if (!obj || !path) return fallback;
  const parts = path.split(".");
  let current = obj;
  for (const p of parts) {
    if (current === null || current === undefined) return fallback;
    current = current[p];
  }
  return current === undefined ? fallback : current;
};

/**
 * Safely set a deeply nested value, creating intermediate objects as needed.
 * Returns a NEW object (immutable).
 * @param {Object} obj
 * @param {string} path
 * @param {*}      value
 * @returns {Object}
 */
exports.set = function (obj, path, value) {
  if (!path) throw new Error("[unicompare] path is required");
  const root = deepClone(obj || {});
  const parts = path.split(".");
  let current = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!current[p] || typeof current[p] !== "object") current[p] = {};
    current = current[p];
  }
  current[parts[parts.length - 1]] = value;
  return root;
};

/**
 * Check if a deeply nested path exists in an object.
 * @param {Object} obj
 * @param {string} path
 * @returns {boolean}
 */
exports.has = function (obj, path) {
  if (!obj || !path) return false;
  const parts = path.split(".");
  let current = obj;
  for (const p of parts) {
    if (
      current === null ||
      current === undefined ||
      !Object.prototype.hasOwnProperty.call(Object(current), p)
    ) {
      return false;
    }
    current = current[p];
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────
//  11. isEmpty  —  Universal emptiness check
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns true if the value is "empty":
 *   null, undefined, '', [], {}, Map(0), Set(0)
 *
 * @param {*} value
 * @returns {boolean}
 */
exports.isEmpty = function (value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

// ─────────────────────────────────────────────────────────────────────
//  12. typeOf  —  Reliable type detection
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns a reliable string type tag for any value.
 * More precise than native `typeof`.
 *
 * @param {*} value
 * @returns {string}
 */
exports.typeOf = function (value) {
  return typeOf(value);
};

// ─────────────────────────────────────────────────────────────────────
//  13. keyPaths  —  List all dot-notation paths in an object
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns an array of all key paths in a nested object.
 *   { a: { b: 1, c: { d: 2 } } }  →  ['a', 'a.b', 'a.c', 'a.c.d']
 *
 * @param {Object} obj
 * @returns {string[]}
 */
exports.keyPaths = function (obj) {
  const paths = [];
  const walk = (current, prefix) => {
    for (const key of Object.keys(current)) {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.push(path);
      if (isPlainObject(current[key])) {
        walk(current[key], path);
      }
    }
  };
  if (isPlainObject(obj)) walk(obj, "");
  return paths;
};
