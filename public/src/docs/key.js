/*
 * 文档快捷键
 * nolure@vip.qq.com
 * 2014-4-1
 */
define(function(require){
    var $ = require('$'),key = {};
     
    key.methods = {};
    
    $(document).keydown(function(e){
        var code = e.keyCode,
            tag = e.target.tagName.toLowerCase();
        
        if( tag=='input' || tag=='textarea' || e.target.contentEditable=='true' ){
            return;
        }
        //console.log(code)
        for( var i in key.methods ){
            if( i==code ){
                key.methods[i]();
            }
        }
    });
    
    return key;
});
