const uc = require("../src/unicompare");
const jsn1 = require("./data1.json");
const jsn2 = require("./copyOfData1.json");
const diffJsn = require("./copyOfData1WithWrongParam.json");
const deepSomeTest = require("./deepSomeTest.json");

let pass = 0;
let fail = 0;
const total = () => pass + fail;

function assert(label, actual, expected) {
  const ok =
    typeof expected === "object"
      ? JSON.stringify(actual) === JSON.stringify(expected)
      : actual === expected;
  if (ok) {
    pass++;
    console.log(`  ✅  ${label}`);
  } else {
    fail++;
    console.log(`  ❌  ${label}`);
    console.log(`       expected: ${JSON.stringify(expected)}`);
    console.log(`       got:      ${JSON.stringify(actual)}`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log("\n══════════════════════════════════════════════════════════");
console.log("  UNICOMPARE  —  Full Test Suite");
console.log("══════════════════════════════════════════════════════════\n");

// ── 1. objEqual ──────────────────────────────────────────────────
console.log("─── objEqual ─────────────────────────────────────────");
assert("equal objects (deep)", uc.objEqual(jsn1, jsn2, true), true);
assert("equal objects (shallow)", uc.objEqual(jsn1, jsn2, false), true);
assert("different objects (deep)", uc.objEqual(jsn1, diffJsn, true), false);
assert("different objects (shallow)", uc.objEqual(jsn1, diffJsn, false), false);
assert("NaN === NaN", uc.objEqual(NaN, NaN, true), true);
assert(
  "Date equality",
  uc.objEqual(new Date(1000), new Date(1000), true),
  true,
);
assert(
  "Date inequality",
  uc.objEqual(new Date(1000), new Date(2000), true),
  false,
);
assert("RegExp equality", uc.objEqual(/abc/gi, /abc/gi, true), true);
assert("Array equality", uc.objEqual([1, [2, 3]], [1, [2, 3]], true), true);
assert("Array inequality", uc.objEqual([1, 2], [1, 3], true), false);
assert(
  "Nested deep",
  uc.objEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }, true),
  true,
);
assert(
  "Nested deep diff",
  uc.objEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }, true),
  false,
);

// Circular reference test
const circA = { x: 1 };
circA.self = circA;
const circB = { x: 1 };
circB.self = circB;
assert("circular reference handling", uc.objEqual(circA, circB, true), true);

// ── 2. some ──────────────────────────────────────────────────────
console.log("\n─── some ─────────────────────────────────────────────");
assert("find array in object", uc.some({ test: [1, 2, 3] }, [1, 2, 3]), true);
assert("ultra deep search", uc.some(deepSomeTest, [1, 2, 3]), true);
assert("value not found", uc.some(deepSomeTest, [99, 100]), false);
assert("find primitive deep", uc.some({ a: { b: { c: 42 } } }, 42), true);
assert(
  "find string in nested",
  uc.some({ a: [{ b: "hello" }] }, "hello"),
  true,
);

// ── 3. diff ──────────────────────────────────────────────────────
console.log("\n─── diff ─────────────────────────────────────────────");
const diffs = uc.diff(jsn1, diffJsn);
assert("diff detects changes", diffs.length > 0, true);
assert(
  "diff detects age change",
  diffs.some((d) => d.path === "age" && d.type === "changed"),
  true,
);
assert(
  "diff detects car3 change",
  diffs.some((d) => d.path === "cars.car3" && d.type === "changed"),
  true,
);

const diffAdd = uc.diff({ a: 1 }, { a: 1, b: 2 });
assert(
  "diff detects added key",
  diffAdd.some((d) => d.type === "added" && d.path === "b"),
  true,
);

const diffRem = uc.diff({ a: 1, b: 2 }, { a: 1 });
assert(
  "diff detects removed key",
  diffRem.some((d) => d.type === "removed" && d.path === "b"),
  true,
);

// ── 4. deepMerge ─────────────────────────────────────────────────
console.log("\n─── deepMerge ────────────────────────────────────────");
const merged = uc.deepMerge({ a: 1, b: { x: 1 } }, { b: { y: 2 }, c: 3 });
assert("merge top-level", merged.a, 1);
assert("merge nested preserves", merged.b.x, 1);
assert("merge nested adds", merged.b.y, 2);
assert("merge new key", merged.c, 3);

// ── 5. deepClone ─────────────────────────────────────────────────
console.log("\n─── deepClone ────────────────────────────────────────");
const original = { a: { b: [1, 2, { c: 3 }] }, d: new Date(1000) };
const cloned = uc.deepClone(original);
assert("clone is equal", uc.objEqual(original, cloned, true), true);
assert("clone is independent", original.a !== cloned.a, true);
assert(
  "clone Date",
  cloned.d instanceof Date && cloned.d.getTime() === 1000,
  true,
);

// ── 6. structuralEqual ───────────────────────────────────────────
console.log("\n─── structuralEqual ──────────────────────────────────");
assert(
  "same structure diff values",
  uc.structuralEqual({ a: 1, b: { c: 2 } }, { a: "x", b: { c: "y" } }),
  true,
);
assert("different structure", uc.structuralEqual({ a: 1 }, { b: 1 }), false);

// ── 7. pick / omit ──────────────────────────────────────────────
console.log("\n─── pick / omit ──────────────────────────────────────");
const pickResult = uc.pick(jsn1, ["name", "cars.car1"]);
assert("pick top-level", pickResult.name, "John");
assert("pick nested", pickResult.cars && pickResult.cars.car1, "Ford");
assert("pick excludes rest", pickResult.age, undefined);

const omitResult = uc.omit(jsn1, ["name", "age"]);
assert("omit removes keys", omitResult.name, undefined);
assert("omit preserves rest", !!omitResult.cars, true);

// ── 8. Array utilities ──────────────────────────────────────────
console.log("\n─── Array utilities ──────────────────────────────────");
assert("intersect", uc.intersect([1, 2, 3], [2, 3, 4]), [2, 3]);
assert("union", uc.union([1, 2], [2, 3]), [1, 2, 3]);
assert("difference", uc.difference([1, 2, 3], [2]), [1, 3]);
assert("unique", uc.unique([1, 2, 2, 3, 3, 3]), [1, 2, 3]);
assert(
  "intersect objects",
  uc.intersect([{ a: 1 }, { b: 2 }], [{ a: 1 }, { c: 3 }]),
  [{ a: 1 }],
);

// ── 9. flatten / unflatten ───────────────────────────────────────
console.log("\n─── flatten / unflatten ──────────────────────────────");
const flat = uc.flatten({ a: { b: 1, c: { d: 2 } } });
assert("flatten", flat, { "a.b": 1, "a.c.d": 2 });
const unflat = uc.unflatten({ "a.b": 1, "a.c.d": 2 });
assert(
  "unflatten",
  uc.objEqual(unflat, { a: { b: 1, c: { d: 2 } } }, true),
  true,
);

// ── 10. get / set / has ──────────────────────────────────────────
console.log("\n─── get / set / has ──────────────────────────────────");
assert("get existing", uc.get(jsn1, "cars.car1"), "Ford");
assert(
  "get missing with fallback",
  uc.get(jsn1, "x.y.z", "default"),
  "default",
);
assert("has existing", uc.has(jsn1, "cars.car2"), true);
assert("has missing", uc.has(jsn1, "cars.car99"), false);
const setResult = uc.set({}, "a.b.c", 42);
assert("set deep", setResult.a.b.c, 42);
assert("set is immutable", uc.get({}, "a.b.c", null), null);

// ── 11. isEmpty ──────────────────────────────────────────────────
console.log("\n─── isEmpty ──────────────────────────────────────────");
assert("isEmpty null", uc.isEmpty(null), true);
assert("isEmpty undefined", uc.isEmpty(undefined), true);
assert('isEmpty ""', uc.isEmpty(""), true);
assert("isEmpty []", uc.isEmpty([]), true);
assert("isEmpty {}", uc.isEmpty({}), true);
assert("not empty string", uc.isEmpty("a"), false);
assert("not empty array", uc.isEmpty([1]), false);
assert("not empty object", uc.isEmpty({ a: 1 }), false);

// ── 12. typeOf ───────────────────────────────────────────────────
console.log("\n─── typeOf ───────────────────────────────────────────");
assert("typeOf null", uc.typeOf(null), "null");
assert("typeOf array", uc.typeOf([]), "array");
assert("typeOf date", uc.typeOf(new Date()), "date");
assert("typeOf regexp", uc.typeOf(/x/), "regexp");
assert("typeOf map", uc.typeOf(new Map()), "map");
assert("typeOf set", uc.typeOf(new Set()), "set");
assert("typeOf object", uc.typeOf({}), "object");
assert("typeOf string", uc.typeOf(""), "string");

// ── 13. keyPaths ─────────────────────────────────────────────────
console.log("\n─── keyPaths ─────────────────────────────────────────");
const kp = uc.keyPaths({ a: { b: 1, c: { d: 2 } }, e: 3 });
assert("keyPaths count", kp.length, 5);
assert("keyPaths includes nested", kp.includes("a.c.d"), true);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log("\n══════════════════════════════════════════════════════════");
console.log(
  `  RESULTS:  ${pass} passed  /  ${fail} failed  /  ${total()} total`,
);
console.log("══════════════════════════════════════════════════════════\n");

process.exit(fail > 0 ? 1 : 0);
