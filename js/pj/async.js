define("pj/async", [ "./a", "./b", "./c" ], function(require) {
    require("./a");
    console.log("async.js");
    return "Async";
});

define("pj/a", [ "pj/b", "pj/c" ], function(require, exports, module) {
    var b = require("pj/b");
    exports.a = "a";
    console.log("a.js", b);
});

define("pj/b", [ "pj/c" ], function(require, exports, module) {
    var c = require("pj/c");
    exports.b = "bb";
    console.log("b.js");
});

define("pj/c", [], function(require, exports, module) {
    exports.c = "cc";
    console.log("c.js");
});
