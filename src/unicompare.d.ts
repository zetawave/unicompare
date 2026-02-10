declare module "unicompare" {
  /** Detailed diff entry returned by `diff()`. */
  export interface DiffEntry {
    type: "added" | "removed" | "changed" | "type_changed";
    path: string;
    oldValue?: any;
    newValue?: any;
  }

  /** Reliable type tags. */
  export type TypeTag =
    | "null"
    | "undefined"
    | "array"
    | "date"
    | "regexp"
    | "map"
    | "set"
    | "object"
    | "number"
    | "string"
    | "boolean"
    | "function"
    | "bigint"
    | "symbol";

  // ── Core comparison ─────────────────────────────────────────────

  /** Deep / shallow equality between two values. */
  export function objEqual(obj1: any, obj2: any, deep?: boolean): boolean;

  /** Deep search — returns true if `needle` exists anywhere inside `haystack`. */
  export function some(rootObj: any, v: any): boolean;

  /** Compute a list of differences between two objects. */
  export function diff(obj1: object, obj2: object): DiffEntry[];

  /** Returns true if two objects have the same key structure (values ignored). */
  export function structuralEqual(obj1: object, obj2: object): boolean;

  // ── Object utilities ────────────────────────────────────────────

  /** Deep-merge multiple sources into a new object. */
  export function deepMerge(...sources: object[]): object;

  /** Create a deep clone. Handles Date, RegExp, Map, Set, circular refs. */
  export function deepClone<T>(value: T): T;

  /** Return a new object with only the listed keys. Supports dot-notation. */
  export function pick<T extends object>(obj: T, keys: string[]): Partial<T>;

  /** Return a new object WITHOUT the listed keys. */
  export function omit<T extends object>(obj: T, keys: string[]): Partial<T>;

  /** Flatten a nested object into dot-notation keys. */
  export function flatten(obj: object, separator?: string): Record<string, any>;

  /** Unflatten dot-notation keys back into nested structure. */
  export function unflatten(
    obj: Record<string, any>,
    separator?: string,
  ): object;

  /** Safely get a deeply nested value by dot-notation path. */
  export function get<T = any>(obj: object, path: string, fallback?: T): T;

  /** Immutably set a deeply nested value. Returns a new object. */
  export function set(obj: object, path: string, value: any): object;

  /** Check if a deeply nested path exists. */
  export function has(obj: object, path: string): boolean;

  // ── Array utilities ─────────────────────────────────────────────

  /** Elements present in BOTH arrays (deep comparison). */
  export function intersect<T>(a: T[], b: T[]): T[];

  /** Union of two arrays, removing deep-duplicates. */
  export function union<T>(a: T[], b: T[]): T[];

  /** Elements in `a` NOT in `b` (deep comparison). */
  export function difference<T>(a: T[], b: T[]): T[];

  /** Remove deep-duplicate values from an array. */
  export function unique<T>(arr: T[]): T[];

  // ── Misc utilities ──────────────────────────────────────────────

  /** Universal emptiness check (null, undefined, '', [], {}, Map(0), Set(0)). */
  export function isEmpty(value: any): boolean;

  /** Reliable type detection — more precise than native `typeof`. */
  export function typeOf(value: any): TypeTag;

  /** List all dot-notation key paths in a nested object. */
  export function keyPaths(obj: object): string[];
}
