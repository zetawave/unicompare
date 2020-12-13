verbose = false // edit this to enable print

exports.log = function(text) {
    if (verbose) { console.debug(text) }
}

exports.error = function(text) {
    if (verbose) { console.error(text) }
}

exports.debug = function(text) {
    if (verbose) { console.debug(text) }
}

exports.stringify = function(v) {
    return JSON.stringify(v)
}
