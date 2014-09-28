define("pj/a", [ "pj/b", "pj/c" ], function(require, exports, module) {
    var b = require("pj/b");
    exports.a = "a";
    console.log("a.js", b);
});
