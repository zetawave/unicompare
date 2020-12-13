const shared = require('./shared')

/**
 * Compare two objects, any difference interrupts the check
 * @param {Object} obj1 -> First object
 * @param {Object} obj2 -> Second object
 * @param {Boolean} deep -> Deep compare
 */

exports.objEqual = function (obj1, obj2, deep) {
    return objEqual(obj1, obj2, deep, false)
}

/**
 * 
 * @param {*} obj1 -> First object 
 * @param {*} obj2 -> Second object
 * @param {*} deep -> deep equal
 * @param {*} over -> avoid null object check
 */
const objEqual = (obj1, obj2, deep, over) => {

    if (!over && !obj1) { throw Error("[ERROR] - obj1 is not defined") }
    shared.debug('[*] - obj1 is ok')
    if (!over && !obj2) { throw Error("[ERROR] - obj2 is not defined") }
    shared.debug('[*] - obj2 is ok')
    if (deep !== true && deep !== false) { throw new Error("Invalid deep parameter type") }
    shared.debug('[*] - deep parameter is ok')

    let obj1Keys = Object.keys(obj1).sort()
    let obj2Keys = Object.keys(obj2).sort()

    if (obj1Keys.length !== obj2Keys.length ||
        JSON.stringify(obj1Keys) !== JSON.stringify(obj2Keys)) { return false }
    shared.debug('[*] - Keys of obj1 and obj2 are equal')
    let isDiff = false

    let obj1Values = Object.values(obj1)
    let obj2Values = Object.values(obj2)

    for (let i = 0; i < obj1Values.length; i++) {
        shared.debug('[*] - Test ' + JSON.stringify(obj1Values[i]) + ", type: " + typeof obj1Values[i])
        shared.debug(obj1Values[i] instanceof Array)
        shared.debug(typeof obj1Values[i] === 'object')

        if (obj1Values[i] instanceof Array) {
            shared.debug('[*] - obj1 is an array')
            if (!(obj2Values[i] instanceof Array) ||
                JSON.stringify(obj1Values[i]) !== JSON.stringify(obj2Values[i])) {
                shared.debug('[ERROR] - obj1 and obj2 are different or have different types')
                isDiff = true
                break
            }
            shared.debug('[*] - obj1 and obj2 are equal')
            continue
        } else if (typeof obj1Values[i] === 'object' &&
            obj1Values[i] !== null &&
            obj1Values[i] !== undefined) {
            if (!deep) {
                continue
            }
            if (typeof obj2Values[i] !== 'object') {
                shared.debug('[*] - [ERROR] - obj2 is not an object like obj1')
                isDiff = true
                break
            }
            isDiff = objEqual(obj1Values[i], obj2Values[i], deep, true)
            if (!isDiff) {
                isDiff = true
                shared.debug('[*] - [ERROR] - Deep level error not equal')
                break
            }
            shared.debug('[DEEP LEVEL] - obj1 and obj2 are equal')
            continue
        } else {
            isDiff = obj1Values[i] !== obj2Values[i]
            if (isDiff) {
                shared.debug('[ERROR] - obj1 and obj2 are not equal')
                break
            }
            shared.debug('[*] - obj1 and obj2 are equal')
            continue
        }
    }
    shared.debug('[*] - Returning: ' + isDiff)
    return !isDiff
}