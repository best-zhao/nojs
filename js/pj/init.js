define("pj/init", [ "./a", "./b", "./c", "pj/noncmd" ], function(require, exports, module) {
    require("./a");
    require("pj/noncmd");
    function async() {
        require.async("./async", function(a) {
            console.log("callback:" + a);
        });
    }
    async();
    async();
    async();
    exports.init = "init";
    console.log("init.js");
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
