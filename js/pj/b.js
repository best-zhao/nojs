define("pj/b", [ "./c" ], function(require, exports, module) {
    var c = require("./c");
    exports.b = "bb";
    console.log("b.js");
});

define("pj/c", [], function(require, exports, module) {
    exports.c = "cc";
    console.log("c.js");
});
