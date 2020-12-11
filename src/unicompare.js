/**
 * Compare two objects
 * @param {Object} obj1 -> First object
 * @param {Object} obj2 -> Second object
 * @param {Boolean} deep -> Deep compare
 */

var verbose = false

exports.objEqual = function (obj1, obj2, deep) {
    return objEqual(obj1, obj2, deep, false, false)
}

/**
 * 
 * @param {*} obj1 -> First object 
 * @param {*} obj2 -> Second object
 * @param {*} deep -> deep equal
 * @param {*} over -> avoid null object check
 * @param {*} v    -> verbose log
 */
const objEqual = (obj1, obj2, deep, over, v) => {
    verbose = v
    if (!over && !obj1) { throw Error("[ERROR] - obj1 is not defined") }
    debug('[*] - obj1 is ok')
    if (!over && !obj2) { throw Error("[ERROR] - obj2 is not defined") }
    debug('[*] - obj2 is ok')
    if (deep !== true && deep !== false) { throw new Error("Invalid deep parameter type") }
    debug('[*] - deep parameter is ok')

    let obj1Keys = Object.keys(obj1).sort()
    let obj2Keys = Object.keys(obj2).sort()

    if (obj1Keys.length !== obj2Keys.length ||
        JSON.stringify(obj1Keys) !== JSON.stringify(obj2Keys)) { return false }
    debug('[*] - Keys of obj1 and obj2 are equal')
    let isDiff = false

    let obj1Values = Object.values(obj1)
    let obj2Values = Object.values(obj2)

    for (let i = 0; i < obj1Values.length; i++) {
        debug('[*] - Test ' + JSON.stringify(obj1Values[i]) + ", type: " + typeof obj1Values[i])
        debug(obj1Values[i] instanceof Array)
        debug(typeof obj1Values[i] === 'object')

        if (obj1Values[i] instanceof Array) {
            debug('[*] - obj1 is an array')
            if (!(obj2Values[i] instanceof Array) ||
                JSON.stringify(obj1Values[i]) !== JSON.stringify(obj2Values[i])) {
                debug('[ERROR] - obj1 and obj2 are different or have different types')
                isDiff = true
                break
            }
            debug('[*] - obj1 and obj2 are equal')
            continue
        } else if (typeof obj1Values[i] === 'object' &&
            obj1Values[i] !== null &&
            obj1Values[i] !== undefined) {
            if (!deep) {
                continue
            }
            if (typeof obj2Values[i] !== 'object') {
                debug('[*] - [ERROR] - obj2 is not an object like obj1')
                isDiff = true
                break
            }
            isDiff = objEqual(obj1Values[i], obj2Values[i], deep, true, v)
            if (!isDiff) {
                isDiff = true
                debug('[*] - [ERROR] - Deep level error not equal')
                break
            }
            debug('[DEEP LEVEL] - obj1 and obj2 are equal')
            continue
        } else {
            isDiff = obj1Values[i] !== obj2Values[i]
            if (isDiff) {
                debug('[ERROR] - obj1 and obj2 are not equal')
                break
            }
            debug('[*] - obj1 and obj2 are equal')
            continue
        }
    }
    debug('[*] - Returning: ' + isDiff)
    return !isDiff
}

const log = (text) => {
    if (verbose) { console.debug(text) }
}

const error = (text) => {
    if (verbose) { console.error(text) }
}

const debug = (text) => {
    if (verbose) { console.debug(text) }
}
