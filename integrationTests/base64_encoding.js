"use strict";
exports.__esModule = true;
var fs = require("fs");
// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString("base64");
}
exports["default"] = base64_encode;
