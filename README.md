# unicompare

![npm](https://img.shields.io/npm/v/unicompare)

Universal comparator for javascript with recursive and deep support

## Quick start

### 1 - Install

``` bash
# npm
npm install unicompare
```

### 2 - Import
``` bash
const unicompare = require('unicompare')
...
```

## Methods

|Name|Type|Description
|:--:|:-----|:-----|
|**`objEqual(obj1, obj2, deep)`**|Boolean| return true if the objects obj1 and obj2 are the same, pass deep = true if you want to perform a recursive search on any objects inside the root object
|**`some(obj1, value)`**|Boolean| function( obj1: Any, value: Any ) Returns 'true' if it finds the passed value 'Value' anywhere within the 'Any' object
