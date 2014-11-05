/*
 * 文档快捷键
 * nolure@vip.qq.com
 * 2014-4-1
 */
define(function(require){
    var $ = require('$'),key = {}, assist;
     
    key.methods = {};
    
    $(document).keydown(function(e){
        var code = e.keyCode,
            tag = e.target.tagName.toLowerCase();
        //ctrl 17
        //shift 16
        //alt 18
        assist = assist || code==17 || code==18 || code==16;
        if( assist || tag=='input' || tag=='textarea' || e.target.contentEditable=='true' ){
            return;
        }
        for( var i in key.methods ){
            if( i==code ){
                key.methods[i]();
            }
        }
    }).keyup(function(){
        assist = null;
    });
    
    return key;
});
