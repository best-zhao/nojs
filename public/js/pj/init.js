define("pj/init", [ "./a", "pj/b", "pj/c", "pj/noncmd" ], function(require, exports, module) {
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
