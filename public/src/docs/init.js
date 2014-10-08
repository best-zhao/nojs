define(function(require){
    var $ = require('$'),
        docs = require('./index'),
        codeLight = require('../lib/nojs/mods/codelight'),
        layer = require('../lib/nojs/mods/layer'),
        demo = require('./demo');

    docs.init({
        menu : domain.rs+'/src/docs/config.json',
        defaultNode : 'nojs_info',
        beforeSend : function(){
            //docs.$content.fadeTo(200, 0);
            window.demoAction = null;
        },
        complete : function(){
            //docs.$content.stop().fadeTo(400, 1);
            new codeLight({parent:docs.$wrap});
            operat.hide();
        }
    });

    var $operat = $('#operating .inner_btn'),
    operat = new layer.overlay({
        position : {right:0}
    });
    operat.set('content', $('#op_menu').show());
    operat.on({
        mode : 'click',
        element : $operat
    })
    operat.content.find('.demo').click(function(){
        operat.hide();
        demo.show();
    })

});