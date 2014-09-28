/*
 * 文档快捷键
 * nolure@vip.qq.com
 * 2014-4-1
 */
define("docs/key", [ "lib/jquery/jquery" ], function(require) {
    var $ = require("lib/jquery/jquery"), key = {};
    key.methods = {};
    $(document).keydown(function(e) {
        var code = e.keyCode, tag = e.target.tagName.toLowerCase();
        if (tag == "input" || tag == "textarea" || e.target.contentEditable == "true") {
            return;
        }
        //console.log(code)
        for (var i in key.methods) {
            if (i == code) {
                key.methods[i]();
            }
        }
    });
    return key;
});
