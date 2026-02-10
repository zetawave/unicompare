# unicompare

![npm](https://img.shields.io/npm/v/unicompare)

Universal comparator for JavaScript — fast, recursive, deep-safe, with 20+ utility functions.

## Quick start

### 1 — Install

```bash
npm install unicompare
```

### 2 — Import

```js
const uc = require("unicompare");
```

---

## API Reference

### Comparison

| Method                  | Returns       | Description                                                                                                                |
| :---------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------- |
| `objEqual(a, b, deep?)` | `boolean`     | Deep or shallow equality. Handles `Date`, `RegExp`, `Map`, `Set`, `NaN`, and **circular references**.                      |
| `some(obj, value)`      | `boolean`     | Recursively search if `value` exists anywhere inside `obj`.                                                                |
| `diff(obj1, obj2)`      | `DiffEntry[]` | Returns a detailed list of structural differences (`added`, `removed`, `changed`, `type_changed`) with dot-notation paths. |
| `structuralEqual(a, b)` | `boolean`     | Compare only the **key structure** (shape) of two objects — values are ignored.                                            |

### Object Utilities

| Method                      | Returns    | Description                                                                           |
| :-------------------------- | :--------- | :------------------------------------------------------------------------------------ |
| `deepMerge(...sources)`     | `object`   | Recursively merge N objects into a **new** object. Later sources win.                 |
| `deepClone(value)`          | `any`      | Create a deep clone. Handles `Date`, `RegExp`, `Map`, `Set`, and circular references. |
| `pick(obj, keys)`           | `object`   | New object with only the listed keys. Supports dot-notation (`'a.b.c'`).              |
| `omit(obj, keys)`           | `object`   | New object **without** the listed keys. Supports nested dot-notation.                 |
| `flatten(obj, sep?)`        | `object`   | `{ a: { b: 1 } }` → `{ 'a.b': 1 }`                                                    |
| `unflatten(obj, sep?)`      | `object`   | `{ 'a.b': 1 }` → `{ a: { b: 1 } }`                                                    |
| `get(obj, path, fallback?)` | `any`      | Safe deep property access by dot-notation path.                                       |
| `set(obj, path, value)`     | `object`   | Immutably set a deep value; returns a **new** object.                                 |
| `has(obj, path)`            | `boolean`  | Check if a deep path exists.                                                          |
| `keyPaths(obj)`             | `string[]` | List all dot-notation key paths in a nested object.                                   |

### Array Utilities

| Method             | Returns | Description                                    |
| :----------------- | :------ | :--------------------------------------------- |
| `intersect(a, b)`  | `array` | Elements in **both** arrays (deep comparison). |
| `union(a, b)`      | `array` | Union of two arrays, removing deep-duplicates. |
| `difference(a, b)` | `array` | Elements in `a` **not** in `b`.                |
| `unique(arr)`      | `array` | Remove deep-duplicate values.                  |

### Misc

| Method           | Returns   | Description                                                                          |
| :--------------- | :-------- | :----------------------------------------------------------------------------------- |
| `isEmpty(value)` | `boolean` | `true` for `null`, `undefined`, `''`, `[]`, `{}`, `Map(0)`, `Set(0)`.                |
| `typeOf(value)`  | `string`  | Reliable type tag: `'null'`, `'array'`, `'date'`, `'regexp'`, `'map'`, `'set'`, etc. |

---

## Examples

### Deep equality

```js
uc.objEqual({ a: { b: [1, 2, 3] } }, { a: { b: [1, 2, 3] } }, true); // true
uc.objEqual(NaN, NaN, true); // true
```

### Diff report

```js
uc.diff({ name: "John", age: 30 }, { name: "John", age: 31 });
// [{ type: 'changed', path: 'age', oldValue: 30, newValue: 31 }]
```

### Deep search

```js
uc.some({ a: { b: { c: [1, 2, 3] } } }, [1, 2, 3]); // true
```

### Deep merge

```js
uc.deepMerge({ a: 1, b: { x: 1 } }, { b: { y: 2 }, c: 3 });
// { a: 1, b: { x: 1, y: 2 }, c: 3 }
```

### Safe deep access

```js
uc.get(data, "users.0.address.city", "N/A");
uc.set(data, "users.0.address.city", "Rome"); // new object
uc.has(data, "users.0.address.city"); // true
```

### Flatten / Unflatten

```js
uc.flatten({ a: { b: 1, c: { d: 2 } } }); // { 'a.b': 1, 'a.c.d': 2 }
uc.unflatten({ "a.b": 1, "a.c.d": 2 }); // { a: { b: 1, c: { d: 2 } } }
```

### Array operations

```js
uc.intersect([1, 2, 3], [2, 3, 4]); // [2, 3]
uc.union([1, 2], [2, 3]); // [1, 2, 3]
uc.difference([1, 2, 3], [2]); // [1, 3]
uc.unique([1, 2, 2, 3, 3]); // [1, 2, 3]
```

---

## Performance

- **No `JSON.stringify` for comparisons** — direct value traversal
- **Circular reference safe** — `WeakSet` / `Map` tracking
- **Early exit** — comparison stops at the first difference
- **Zero dependencies** (only Node.js built-ins)

## License

MIT © [Zetawave](https://github.com/zetawave)
