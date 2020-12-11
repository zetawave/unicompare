const unicompare = require('../src/unicompare')
const jsn1 = require('./data1.json')
const jsn2 = require('./copyOfData1.json')
const diffJsn = require('./copyOfData1WithWrongParam.json')

//TODO
console.log("Testing unicompare")
console.log("")
console.log("[ TEST equal objects with deep ] are equal : ", unicompare.objEqual(jsn1, jsn2, true))
console.log("[ TEST equal objects without deep ] are equal : ", unicompare.objEqual(jsn1, jsn2, false))
console.log("[ TEST different objects with deep ] are equal :  ", unicompare.objEqual(jsn1, diffJsn, true))
console.log("[ TEST different objects without deep ] are equal : ", unicompare.objEqual(jsn1, diffJsn, false))